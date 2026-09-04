'use strict';

const { spawn } = require('child_process');
const fs = require('fs');
const { parseConfig, printUsage, validatePorts, isWindowsBatch, spawnBatch } = require('./config');

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

const args = ['auto', '--project', config.projectPath, '--port', String(config.httpPort), '--auto-port', String(config.automationPort)];
// On Windows, cli.bat is a .bat shim that must be routed through cmd.exe with
// a fully-quoted command line so paths like "Program Files" survive intact.
const child = isWindowsBatch(config.cliPath)
  ? spawnBatch(config.cliPath, args, { stdio: 'inherit', env: { ...process.env } })
  : spawn(config.cliPath, args, { stdio: 'inherit', shell: false, windowsHide: true, env: { ...process.env } });

child.once('error', error => { console.error(`Unable to start DevTools automation: ${error.message}`); process.exit(1); });
child.once('exit', (code, signal) => process.exit(code ?? (signal ? 1 : 0)));