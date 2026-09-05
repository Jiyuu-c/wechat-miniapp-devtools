'use strict';

const { spawn } = require('child_process');
const fs = require('fs');
const { parseConfig, printUsage, validatePorts, probePort, detectHttpServicePort, isWindowsBatch, spawnBatch } = require('./config');

const config = parseConfig();
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  printUsage('devtools-auto');
  process.exit(0);
}
if (!config.projectPath || !config.cliPath) {
  printUsage('devtools-auto');
  process.exit(2);
}
if (!fs.existsSync(config.projectPath) || !fs.existsSync(config.cliPath)) throw new Error('Project or CLI path does not exist.');
validatePorts(config);

(async () => {
  // Reuse a live automation session instead of disturbing it. Re-running
  // `cli auto` against an enabled port can restart the session and break
  // other MCP clients connected to it.
  if (await probePort(config.automationPort)) {
    console.log(`Automation already enabled on 127.0.0.1:${config.automationPort}; reusing the existing session (cli auto skipped).`);
    return;
  }

  const args = ['auto', '--project', config.projectPath, '--auto-port', String(config.automationPort)];
  // `cli auto` locates the running IDE by itself when --port is omitted;
  // the HTTP service port changes on every IDE start, so only forward it
  // when explicitly configured.
  if (config.httpPortExplicit) {
    args.push('--port', String(config.httpPort));
  } else {
    const detected = detectHttpServicePort();
    console.log(detected
      ? `No explicit HTTP service port; letting cli auto discover the running IDE (currently ${detected.port} per ${detected.file}).`
      : 'No explicit HTTP service port; letting cli auto discover the running IDE.');
  }

  // On Windows, cli.bat is a .bat shim that must be routed through cmd.exe with
  // a fully-quoted command line so paths like "Program Files" survive intact.
  const child = isWindowsBatch(config.cliPath)
    ? spawnBatch(config.cliPath, args, { stdio: 'inherit', env: { ...process.env } })
    : spawn(config.cliPath, args, { stdio: 'inherit', shell: false, windowsHide: true, env: { ...process.env } });

  child.once('error', error => { console.error(`Unable to start DevTools automation: ${error.message}`); process.exit(1); });
  child.once('exit', (code, signal) => process.exit(code ?? (signal ? 1 : 0)));
})().catch(error => {
  console.error(error.message);
  process.exit(2);
});
