'use strict';

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { parseConfig, printUsage, validatePorts, isWindowsBatch, spawnBatch } = require('./config');

const config = parseConfig();
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  printUsage('run-mcp');
  process.exit(0);
}
if (!config.projectPath) throw new Error('Missing project path. Set MINIAPP_PROJECT_PATH or pass --project-path.');
if (!config.cliPath) throw new Error('Missing DevTools CLI path. Set WECHAT_DEVTOOLS_CLI_PATH or pass --cli-path.');
validatePorts(config);

const mcpArgs = [
  '--project-path',
  config.projectPath,
  '--cli-path',
  config.cliPath,
  '--port',
  String(config.automationPort),
];

// Prefer a locally installed copy of the MCP package (npm install) so the
// server can start offline and without re-resolving the registry on every
// launch. Only use it when its version matches the requested packageVersion
// to avoid silently pinning to an outdated release.
const localCli = path.join(__dirname, '..', 'node_modules', '@creatoria', 'miniapp-mcp', 'dist', 'cli.js');
const localPkg = path.join(__dirname, '..', 'node_modules', '@creatoria', 'miniapp-mcp', 'package.json');
let useLocal = false;
if (fs.existsSync(localCli) && fs.existsSync(localPkg)) {
  try {
    const installed = JSON.parse(fs.readFileSync(localPkg, 'utf8')).version;
    useLocal = installed === config.packageVersion;
  } catch {
    // If the package manifest is unreadable, fall back to npx so a bad local
    // copy cannot block the requested version from starting.
    useLocal = false;
  }
}

let command;
let args;
let child;

if (useLocal) {
  command = process.execPath;
  args = [localCli].concat(mcpArgs);
  child = spawn(command, args, {
    stdio: 'inherit',
    windowsHide: true,
    env: { ...process.env },
  });
} else {
  // Resolve npx next to the running node binary so its %~dp0 (used to
  // locate npx-cli.js) is the actual install dir rather than the CWD.
  const npxCommand = process.env.NPX_PATH || (process.platform === 'win32'
    ? path.join(path.dirname(process.execPath), 'npx.cmd')
    : 'npx');
  command = npxCommand;
  args = ['-y', '--package', `@creatoria/miniapp-mcp@${config.packageVersion}`, 'miniprogram-mcp'].concat(mcpArgs);
  // .cmd shims on Windows cannot be launched directly; route through cmd.exe
  // with a fully-quoted command line so paths with spaces or non-ASCII chars
  // stay intact.
  if (isWindowsBatch(npxCommand)) {
    child = spawnBatch(npxCommand, args, { stdio: 'inherit', env: { ...process.env } });
  } else {
    child = spawn(command, args, {
      stdio: 'inherit',
      windowsHide: true,
      env: { ...process.env },
    });
  }
}

child.once('error', error => { console.error(`Unable to start MCP: ${error.message}`); process.exit(1); });
child.once('exit', (code, signal) => process.exit(code ?? (signal ? 1 : 0)));