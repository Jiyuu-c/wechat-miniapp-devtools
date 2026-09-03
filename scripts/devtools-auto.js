'use strict';

const { spawnSync } = require('child_process');
const fs = require('fs');
const { parseConfig, printUsage, validatePorts } = require('./config');

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
const result = spawnSync(config.cliPath, args, {
  stdio: 'inherit',
  shell: process.platform === 'win32' && /\.(bat|cmd)$/i.test(config.cliPath),
  windowsHide: true,
});
process.exit(result.status === null ? 1 : result.status);
