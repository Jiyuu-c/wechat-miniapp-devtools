'use strict';

const path = require('path');

function valueFromArg(argv, names) {
  for (let i = 0; i < argv.length; i += 1) {
    if (names.includes(argv[i])) return argv[i + 1];
  }
  return undefined;
}

function parseConfig(argv = process.argv.slice(2)) {
  const projectPath = valueFromArg(argv, ['--project-path', '--project']) || process.env.MINIAPP_PROJECT_PATH;
  const cliPath = valueFromArg(argv, ['--cli-path', '--cli']) || process.env.WECHAT_DEVTOOLS_CLI_PATH;
  const httpPort = Number(valueFromArg(argv, ['--http-port']) || process.env.WECHAT_HTTP_PORT || 37733);
  const automationPort = Number(valueFromArg(argv, ['--automation-port', '--port']) || process.env.WECHAT_AUTOMATION_PORT || 37735);
  const packageVersion = valueFromArg(argv, ['--package-version']) || process.env.MCP_PACKAGE_VERSION || '0.2.3';

  return {
    projectPath: projectPath ? path.resolve(projectPath) : '',
    cliPath: cliPath ? path.resolve(cliPath) : '',
    httpPort,
    automationPort,
    packageVersion,
  };
}

function printUsage(command) {
  console.log(`Usage: node scripts/${command}.js --project-path <path> --cli-path <path> [options]`);
  console.log('Options:');
  console.log('  --project-path <path>       Mini Program project root');
  console.log('  --cli-path <path>           WeChat DevTools CLI path');
  console.log('  --http-port <port>          DevTools HTTP service port (default: 37733)');
  console.log('  --automation-port <port>    Automation WebSocket port (default: 37735)');
  console.log('  --package-version <version> MCP package version (default: 0.2.3)');
}

function validatePorts(config) {
  for (const [name, value] of [['http-port', config.httpPort], ['automation-port', config.automationPort]]) {
    if (!Number.isInteger(value) || value < 1 || value > 65535) throw new Error(`Invalid ${name}: ${value}`);
  }
}

module.exports = { parseConfig, printUsage, validatePorts };
