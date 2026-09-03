'use strict';

const fs = require('fs');
const net = require('net');
const { parseConfig, printUsage, validatePorts } = require('./config');

const config = parseConfig();
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  printUsage('preflight');
  process.exit(0);
}

const checks = [];
function check(name, ok, detail) {
  checks.push({ name, ok, detail });
}

try {
  validatePorts(config);
  check('project-path', Boolean(config.projectPath) && fs.existsSync(config.projectPath), config.projectPath || 'missing');
  if (config.projectPath) {
    check('project.config.json or app.json', ['project.config.json', 'app.json'].some(file => fs.existsSync(`${config.projectPath}/${file}`)), config.projectPath);
  }
  check('cli-path', !config.cliPath || fs.existsSync(config.cliPath), config.cliPath || 'not supplied; required before auto mode');
  check('node-version', Number(process.versions.node.split('.')[0]) >= 18, process.version);
  check('http-port != automation-port', config.httpPort !== config.automationPort, `${config.httpPort} != ${config.automationPort}`);
} catch (error) {
  console.error(error.message);
  process.exit(2);
}

const probe = (port) => new Promise(resolve => {
  const socket = net.createConnection({ host: '127.0.0.1', port });
  const timer = setTimeout(() => { socket.destroy(); resolve(false); }, 800);
  socket.once('connect', () => { clearTimeout(timer); socket.destroy(); resolve(true); });
  socket.once('error', () => { clearTimeout(timer); resolve(false); });
});

(async () => {
  check('automation-port', !(await probe(config.automationPort)), `127.0.0.1:${config.automationPort} should be free before starting a new session`);
  const output = { ok: checks.every(item => item.ok), config, checks };
  if (process.argv.includes('--json')) console.log(JSON.stringify(output, null, 2));
  else checks.forEach(item => console.log(`${item.ok ? 'PASS' : 'FAIL'} ${item.name}: ${item.detail}`));
  process.exit(output.ok ? 0 : 1);
})();
