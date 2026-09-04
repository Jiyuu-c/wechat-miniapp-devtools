'use strict';
const path = require('path');
const { spawn } = require('child_process');

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

// Wrap an argument for cmd.exe when using windowsVerbatimArguments. Each
// argument must be enclosed in double quotes so spaces, Chinese characters,
// or other cmd metacharacters in paths are preserved as one token.
function quoteForCmd(arg) {
  return '"' + String(arg).replace(/"/g, '\\"') + '"';
}

// On Windows, .cmd/.bat batch files cannot be spawned with shell:false
// (CreateProcess rejects them with EINVAL), and Node's spawn with
// shell:true on Windows does NOT quote the args it passes to cmd, so
// paths containing spaces (e.g. "Program Files") and metacharacters
// would be split incorrectly. Spawn the batch file via cmd.exe with a
// fully-quoted command line instead.
function isWindowsBatch(file) {
  return process.platform === 'win32' && typeof file === 'string' && /\.(bat|cmd)$/i.test(file);
}

function spawnBatch(file, args, opts) {
  const inner = quoteForCmd(file) + (args.length ? ' ' + args.map(quoteForCmd).join(' ') : '');
  // Wrap the whole command in an outer pair of double quotes so cmd.exe's
  // /s /c parser strips them and executes the inner line as-is instead of
  // treating the first quoted token as a literal program name to look up.
  const line = '"' + inner + '"';
  const comspec = process.env.ComSpec || 'cmd.exe';
  return spawn(comspec, ['/d', '/s', '/c', line], Object.assign({ windowsVerbatimArguments: true, windowsHide: true }, opts));
}

module.exports = { parseConfig, printUsage, validatePorts, isWindowsBatch, spawnBatch };