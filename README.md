# WeChat Mini Program DevTools MCP

A portable MCP integration and Agent workflow pack for developing, debugging, automating, and visually verifying WeChat Mini Programs through the official WeChat DevTools CLI and `miniprogram-automator`.

The project is designed for stdio MCP clients such as Accio Work, WorkBuddy, Trae, Claude Desktop, and other compatible Agent tools.

## What this repository provides

- A cross-platform Node.js launcher for `@creatoria/miniapp-mcp@0.2.3`.
- A DevTools automation helper that separates the HTTP service port from the automation WebSocket port.
- Project preflight checks for `project.config.json`, `app.json`, Node.js, CLI paths, and ports.
- Generic MCP configuration templates driven by environment variables.
- Agent Skills and a visual-validator sub-agent prompt.
- English documentation plus a local Chinese setup guide.

## Port model

WeChat DevTools exposes two different services:

- `--port`: the DevTools HTTP service port.
- `--auto-port`: the Mini Program automation WebSocket port.

Do not use the HTTP port as the MCP automation port. The launcher passes the automation port to `miniprogram-mcp`.

## Requirements

- Windows, macOS, or Linux.
- Node.js 18 or newer.
- WeChat DevTools installed and logged in.
- CLI/HTTP automation enabled in WeChat DevTools security settings.
- A Mini Program root containing `project.config.json` or `app.json`.
- Network access the first time npm downloads `@creatoria/miniapp-mcp@0.2.3`. Optionally run `npm install` once to keep a local copy in `node_modules/`; `scripts/run-mcp.js` then starts it directly (offline, no registry resolution on every launch).

## Machine checklist before first run

Walk this list before you blame the scripts:

1. WeChat DevTools is installed, open, and logged in.
2. DevTools Security Settings → Service Port is **On**. Note the exact port number shown there; it is the DevTools HTTP service port and may not be `37733`.
3. The DevTools CLI path exists and is executable (`F:\微信web开发者工具\cli.bat` on Windows is just an example).
4. The Mini Program root directly contains `project.config.json` or `app.json`.
5. Node.js 18+ is on `PATH` (or use an absolute `command` in the MCP config).
6. The chosen automation WebSocket port is not already in use by another DevTools automation session.
7. The first run needs npm registry access unless you ran `npm install` first.

If `cli auto` fails with `must be restarted on port <requested> first`, you passed the wrong HTTP port to `--http-port` (see "Using an already-running DevTools").

## Switching to another Mini Program

Only these values differ between projects:

| What changes | Where |
|---|---|
| Mini Program project root | `--project-path` / `MINIAPP_PROJECT_PATH` |
| MCP server name (optional) | the service key in your MCP client config |
| Automation WebSocket port | `--automation-port` / `WECHAT_AUTOMATION_PORT` — give each concurrently running DevTools session its own port |
| DevTools HTTP service port | `--http-port` / `WECHAT_HTTP_PORT` — must equal the Service Port number shown in DevTools Settings (default assumption `37733`) |

See `examples/multi-project.example.json` for a two-project config. The DevTools CLI path and the repository path normally stay the same. The target project must already be open in (or openable by) DevTools, and only one session may use a given automation port at a time. The MCP launcher (`run-mcp.js`) needs no other change when you switch projects — restart it with the new environment values.

## Using an already-running DevTools

When DevTools is already open and its HTTP service (Settings → Security Settings → Service Port) is enabled, the service port shown in that dialog may differ from the default `37733`. Pass that actual port as `--http-port` (or `WECHAT_HTTP_PORT`) to `scripts/devtools-auto.js` (which forwards it to `cli auto --port`) so the running IDE can be located and automation can be enabled on `--auto-port`. `scripts/run-mcp.js` does not take an HTTP port. If the port mismatches, `cli auto` aborts with `IDE server has started on http://127.0.0.1:<actual> and must be restarted on port <requested> first`.

## Quick start

From this repository:

```bash
node scripts/preflight.js    --project-path /path/to/miniprogram --cli-path /path/to/cli.bat --http-port <http-port> --automation-port <auto-port>
node scripts/devtools-auto.js --project-path /path/to/miniprogram --cli-path /path/to/cli.bat --http-port <http-port> --automation-port <auto-port>
node scripts/run-mcp.js       --project-path /path/to/miniprogram --cli-path /path/to/cli.bat --automation-port <auto-port>
```

On Windows, use `cli.bat`. On macOS/Linux, use the executable CLI path provided by your WeChat DevTools installation.

## Generic stdio MCP configuration

Copy `examples/mcp-config.example.json`, replace `<REPOSITORY_PATH>` and project values, then paste it into your MCP client. The same stdio shape works in Accio Work, WorkBuddy, Trae, Claude Desktop, and similar clients.

The important fields are:

- `command`: a Node.js executable available to the client.
- `args[0]`: the absolute path to `scripts/run-mcp.js`.
- `env.MINIAPP_PROJECT_PATH`: the Mini Program root.
- `env.WECHAT_DEVTOOLS_CLI_PATH`: the WeChat DevTools CLI path.
- `env.WECHAT_HTTP_PORT`: the DevTools HTTP port.
- `env.WECHAT_AUTOMATION_PORT`: the automation WebSocket port.

For multiple projects, create one named MCP server per project. Use one automation WebSocket port per active DevTools session.

## Project-specific configuration

The launcher supports both command-line arguments and environment variables. Command-line arguments take precedence.

```text
--project-path <path>
--cli-path <path>
--http-port <port>
--automation-port <port>
--package-version <version>
```

Environment variables:

```text
MINIAPP_PROJECT_PATH
WECHAT_DEVTOOLS_CLI_PATH
WECHAT_HTTP_PORT
WECHAT_AUTOMATION_PORT
MCP_PACKAGE_VERSION
```

## Agent workflow

1. Run preflight.
2. Start or reuse DevTools automation with `scripts/devtools-auto.js`.
3. Start the MCP server with `scripts/run-mcp.js`.
4. Call `miniprogram_connect` with the automation WebSocket port.
5. Read page state before interacting.
6. Use assertions and screenshots after important actions.
7. Disconnect the MCP session without unnecessarily closing DevTools.

## Handing off to another agent

Two tiers — the checklist is an upper bound, not a per-run minimum.

**Tier A — the other agent runs on the same machine and can read this repo.** Three things are enough:

```text
Use the local WeChat DevTools automation helper at <REPOSITORY_PATH>
to work on Mini Program project <PROJECT_ROOT>.
Feature goal: <what to build / verify and the acceptance path>.
```

The agent fills in the CLI path, service port, automation port, and DevTools state from this repo and its local setup notes, and probes ports itself. Only correct it verbally if a path moved on this machine (e.g. DevTools was reinstalled to a new drive).

**Tier B — the other agent cannot read local files (cloud agent, remote machine, or unknown).** Paste a complete config block instead: project root, DevTools CLI path, the DevTools Service Port number shown in Security Settings, the automation WebSocket port, the acceptance path, and the security red lines from the section below. Do not omit any value in this tier.

## Security and scope

This project does not bypass WeChat login, project permissions, AppSecret protection, or DevTools security settings. Never commit tokens, cookies, AppSecrets, private project configuration, or machine-specific secrets.

The DevTools simulator is not a substitute for real-device, review-environment, or production validation.

## License

MIT. See [LICENSE](LICENSE).
