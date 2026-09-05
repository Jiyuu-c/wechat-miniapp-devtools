'use strict';

const fs = require('fs');
const { parseConfig, printUsage, validatePorts, probePort, detectHttpServicePort } = require('./config');

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
  check('http-port != automation-port', !config.httpPortExplicit || config.httpPort !== config.automationPort, `${config.httpPort} != ${config.automationPort}`);

  // The HTTP service port is randomized on every IDE start, so an explicitly
  // configured value can silently go stale and make `cli auto --port` abort.
  const detected = detectHttpServicePort();
  if (config.httpPortExplicit && detected) {
    check('http-port matches running IDE', config.httpPort === detected.port, `configured ${config.httpPort} vs ${detected.port} per ${detected.file}`);
  } else {
    check('ide-service-port', true, detected ? `detected ${detected.port} per ${detected.file}` : 'not detected; cli auto will locate the running IDE');
  }
} catch (error) {
  console.error(error.message);
  process.exit(2);
}

(async () => {
  // A listening automation port is not a failure: the supported flow is to
  // reuse the existing session through MCP connect instead of relaunching.
  const automationLive = await probePort(config.automationPort);
  check('automation-port', true, automationLive
    ? `127.0.0.1:${config.automationPort} in use; an automation session already exists and can be reused`
    : `127.0.0.1:${config.automationPort} free; run scripts/devtools-auto.js to enable automation`);
  const output = { ok: checks.every(item => item.ok), config, checks };
  if (process.argv.includes('--json')) console.log(JSON.stringify(output, null, 2));
  else checks.forEach(item => console.log(`${item.ok ? 'PASS' : 'FAIL'} ${item.name}: ${item.detail}`));
  process.exit(output.ok ? 0 : 1);
})();
