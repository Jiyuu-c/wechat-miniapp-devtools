'use strict';
const { spawn } = require('child_process');
const fs = require('fs');
const net = require('net');
const os = require('os');
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
  const httpPortRaw = valueFromArg(argv, ['--http-port']);
  const httpPortEnv = process.env.WECHAT_HTTP_PORT;
  const httpPortExplicit = httpPortRaw !== undefined || Boolean(httpPortEnv);
  const httpPort = httpPortExplicit ? Number(httpPortRaw !== undefined ? httpPortRaw : httpPortEnv) : null;
  const automationPort = Number(valueFromArg(argv, ['--automation-port', '--port']) || process.env.WECHAT_AUTOMATION_PORT || 37735);
  const packageVersion = valueFromArg(argv, ['--package-version']) || process.env.MCP_PACKAGE_VERSION || '0.2.3';

  return {
    projectPath: projectPath ? path.resolve(projectPath) : '',
    cliPath: cliPath ? path.resolve(cliPath) : '',
    // The DevTools HTTP service port changes on every IDE start, so it is
    // optional: when unset, `cli auto` discovers the running IDE by itself
    // (the same behavior as miniprogram-automator's launch).
    httpPort,
    httpPortExplicit,
    automationPort,
    packageVersion,
  };
}

function printUsage(command) {
  console.log(`Usage: node scripts/${command}.js --project-path <path> --cli-path <path> [options]`);
  console.log('Options:');
  console.log('  --project-path <path>       Mini Program project root');
  console.log('  --cli-path <path>           WeChat DevTools CLI path');
  console.log('  --http-port <port>          DevTools HTTP service port (optional; auto-discovered from the running IDE when omitted)');
  console.log('  --automation-port <port>    Automation WebSocket port (default: 37735)');
  console.log('  --package-version <version> MCP package version (default: 0.2.3)');
}

function validatePorts(config) {
  for (const [name, value] of [['http-port', config.httpPort], ['automation-port', config.automationPort]]) {
    if (value === null) continue;
    if (!Number.isInteger(value) || value < 1 || value > 65535) throw new Error(`Invalid ${name}: ${value}`);
  }
}

function probePort(port, timeoutMs = 800) {
  return new Promise(resolve => {
    const socket = net.createConnection({ host: '127.0.0.1', port });
    const timer = setTimeout(() => { socket.destroy(); resolve(false); }, timeoutMs);
    socket.once('connect', () => { clearTimeout(timer); socket.destroy(); resolve(true); });
    socket.once('error', () => { clearTimeout(timer); socket.destroy(); resolve(false); });
  });
}

// Possible root directories of the DevTools per-profile user data. The IDE
// writes its current HTTP service port to <profile>/Default/.ide at every
// start; only the Windows layout is verified, the others are best-effort.
function ideDataRoots() {
  const names = ['微信开发者工具', '微信web开发者工具', 'wechatwebdevtools'];
  if (process.platform === 'win32') {
    const base = process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local');
    return names.map(name => path.join(base, name, 'User Data'));
  }
  if (process.platform === 'darwin') {
    const base = path.join(os.homedir(), 'Library', 'Application Support');
    return names.map(name => path.join(base, name));
  }
  const base = process.env.XDG_CONFIG_HOME || path.join(os.homedir(), '.config');
  return names.map(name => path.join(base, name));
}

function findIdePortFiles() {
  const found = [];
  for (const root of ideDataRoots()) {
    if (!fs.existsSync(root)) continue;
    const profileDirs = fs.readdirSync(root, { withFileTypes: true })
      .filter(entry => entry.isDirectory())
      .map(entry => path.join(root, entry.name, 'Default'));
    profileDirs.push(path.join(root, 'Default'));
    for (const dir of profileDirs) {
      const file = path.join(dir, '.ide');
      try {
        const stat = fs.statSync(file);
        if (stat.isFile()) found.push({ file, mtime: stat.mtimeMs });
      } catch {
        // Not present in this profile; keep scanning.
      }
    }
  }
  return found.sort((a, b) => b.mtime - a.mtime);
}

// Returns { port, file } for the freshest .ide file, or null when the IDE has
// never written one (service port disabled or a non-standard data directory).
function detectHttpServicePort() {
  for (const { file } of findIdePortFiles()) {
    try {
      const port = Number(fs.readFileSync(file, 'utf8').trim());
      if (Number.isInteger(port) && port >= 1 && port <= 65535) return { port, file };
    } catch {
      // Unreadable file; try the next profile.
    }
  }
  return null;
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

module.exports = { parseConfig, printUsage, validatePorts, probePort, detectHttpServicePort, isWindowsBatch, spawnBatch };
