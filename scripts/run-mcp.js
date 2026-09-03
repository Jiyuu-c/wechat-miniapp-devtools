'use strict';

const { spawn } = require('child_process');
const { parseConfig, printUsage, validatePorts } = require('./config');

const config = parseConfig();
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  printUsage('run-mcp');
  process.exit(0);
}
if (!config.projectPath) throw new Error('Missing project path. Set MINIAPP_PROJECT_PATH or pass --project-path.');
if (!config.cliPath) throw new Error('Missing DevTools CLI path. Set WECHAT_DEVTOOLS_CLI_PATH or pass --cli-path.');
validatePorts(config);

const npxCommand = process.env.NPX_PATH || (process.platform === 'win32' ? 'npx.cmd' : 'npx');
const args = [
  '-y',
  '--package',
  `@creatoria/miniapp-mcp@${config.packageVersion}`,
  'miniprogram-mcp',
  '--project-path',
  config.projectPath,
  '--cli-path',
  config.cliPath,
  '--port',
  String(config.automationPort),
];

const child = spawn(npxCommand, args, {
  stdio: 'inherit',
  windowsHide: true,
  shell: false,
  env: { ...process.env },
});
child.once('error', error => { console.error(`Unable to start MCP: ${error.message}`); process.exit(1); });
child.once('exit', (code, signal) => process.exit(code ?? (signal ? 1 : 0)));
