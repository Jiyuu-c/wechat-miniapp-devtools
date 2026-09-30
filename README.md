# WeChat Mini Program DevTools MCP

A portable MCP integration and Agent workflow pack for developing, debugging, automating, and visually verifying WeChat Mini Programs through the official WeChat DevTools CLI and `miniprogram-automator`.

The project is designed for stdio MCP clients such as ZCode, Accio Work, WorkBuddy, Trae, Claude Desktop, and other compatible Agent tools.

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

The HTTP service port is randomized on every DevTools start, so it is **optional** in this project. When `--http-port` is not given, `scripts/devtools-auto.js` omits `cli auto --port` and lets the CLI locate the running IDE itself (the same behavior as `miniprogram-automator.launch`), and the scripts report the currently detected port read from the IDE's `Default/.ide` file. Only set the HTTP port explicitly when you run several DevTools instances in parallel and must pin each one.

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
2. DevTools Security Settings → Service Port is **On**. The port number shown there is randomized on every IDE start; you do not need to copy it anywhere, the scripts detect it automatically. Set it explicitly only for parallel DevTools instances.
3. The DevTools CLI path exists and is executable (`F:\微信web开发者工具\cli.bat` on Windows is just an example).
4. The Mini Program root directly contains `project.config.json` or `app.json`.
5. Node.js 18+ is on `PATH` (or use an absolute `command` in the MCP config).
6. The chosen automation WebSocket port is not already in use by another DevTools automation session (if it is, the scripts reuse the live session instead of starting a second one).
7. The first run needs npm registry access unless you ran `npm install` first.

If `cli auto` fails with `must be restarted on port <requested> first`, you passed the wrong HTTP port to `--http-port` (see "Using an already-running DevTools").

## Switching to another Mini Program

Only these values differ between projects:

| What changes | Where |
|---|---|
| Mini Program project root | `--project-path` / `MINIAPP_PROJECT_PATH` |
| MCP server name (optional) | the service key in your MCP client config |
| Automation WebSocket port | `--automation-port` / `WECHAT_AUTOMATION_PORT` — not fixed across IDE restarts: after every IDE cold start, re-arm it with `cli auto --auto-port` before connecting; give each concurrently running DevTools session its own port |
| DevTools HTTP service port (optional) | `--http-port` / `WECHAT_HTTP_PORT` — only for pinning parallel DevTools instances; when omitted, the CLI discovers the running IDE automatically |

See `examples/multi-project.example.json` for a two-project config. The DevTools CLI path and the repository path normally stay the same. The target project must already be open in (or openable by) DevTools, and only one session may use a given automation port at a time. The MCP launcher (`run-mcp.js`) needs no other change when you switch projects — restart it with the new environment values.

## Using an already-running DevTools

`scripts/devtools-auto.js` is idempotent. It first probes the automation WebSocket port:

- If something is already listening there, it prints `reusing the existing session` and exits 0 without touching the live session. This is what makes several agents take turns on one DevTools instance safe.
- If the port is free, it enables automation with `cli auto --project <root> --auto-port <port>`. When `--http-port` (or `WECHAT_HTTP_PORT`) is not set, no `--port` is forwarded and the CLI locates the running IDE by itself, so a stale hard-coded service port can no longer abort the call with `IDE server has started on http://127.0.0.1:<actual> and must be restarted on port <requested> first`. On Windows, invoke `cli.bat` from PowerShell with the call operator (`& "...\cli.bat" auto ...`); escaping it through bash `cmd //c` drops into interactive mode.

`scripts/preflight.js` reports the currently detected HTTP service port (read from the IDE's `Default/.ide` file) and, if you passed an explicit one that no longer matches the running IDE, flags it as stale. A listening automation port is reported as reusable, not as a failure.

The service port shown in DevTools Settings → Security Settings must still be switched **On**; its numeric value just no longer needs to be copied into any config.

## Degraded sessions and page-level tool timeouts

A listening automation port does not guarantee a healthy session. Depending on the DevTools build and base library, the session-level tools (`miniprogram_connect`, `miniprogram_get_page_stack`, `miniprogram_navigate`, `miniprogram_screenshot`, `miniprogram_evaluate`, `miniprogram_get_system_info`) can respond while every page/element tool (`page_query`, `page_get_data`, `element_tap`, `snapshot_page`, ...) hangs forever. When that happens:

- Use `miniprogram_evaluate` as a drop-in replacement: it executes JS in the app context, so it can read and write page data (`getCurrentPages()`, `setData`), call page methods, and drive business logic — verified working end to end.
- Re-arm the session with `node scripts/devtools-auto.js ... --force`, which runs `cli auto` even though the port is listening (this restarts the project window, so coordinate with anyone else using DevTools first).

These page-level hangs come from the DevTools/page-automation bridge itself, not from this repository: connecting with `miniprogram-automator` directly reproduces them identically.

## Quick start

From this repository:

```bash
node scripts/preflight.js    --project-path /path/to/miniprogram --cli-path /path/to/cli.bat --automation-port <auto-port>
node scripts/devtools-auto.js --project-path /path/to/miniprogram --cli-path /path/to/cli.bat --automation-port <auto-port>
node scripts/run-mcp.js       --project-path /path/to/miniprogram --cli-path /path/to/cli.bat --automation-port <auto-port>
```

Add `--http-port <port>` only when you must pin a specific DevTools instance (parallel IDEs).

On Windows, use `cli.bat`. On macOS/Linux, use the executable CLI path provided by your WeChat DevTools installation.

## Generic stdio MCP configuration

Copy `examples/mcp-config.example.json`, replace `<REPOSITORY_PATH>` and project values, then paste it into your MCP client. The same stdio shape works in ZCode, Accio Work, WorkBuddy, Trae, Claude Desktop, and similar clients.

The important fields are:

- `command`: a Node.js executable available to the client.
- `args[0]`: the absolute path to `scripts/run-mcp.js`.
- `env.MINIAPP_PROJECT_PATH`: the Mini Program root.
- `env.WECHAT_DEVTOOLS_CLI_PATH`: the WeChat DevTools CLI path.
- `env.WECHAT_AUTOMATION_PORT`: the automation WebSocket port.

`WECHAT_HTTP_PORT` is optional and only affects `devtools-auto.js`; omit it and the CLI discovers the running IDE. For multiple projects, create one named MCP server per project. Use one automation WebSocket port per active DevTools session, and remember the port must be re-armed via `cli auto --auto-port` after every IDE restart.

### ZCode

ZCode reads MCP servers from its user configuration (`~/.zcode/cli/config.json`) or the workspace configuration (`<repo>/.zcode/config.json`) under the `mcp.servers` key, and connects them automatically at session start. Copy `examples/mcp-config.zcode.json` and merge it into the target config file:

```json
{
  "mcp": {
    "servers": {
      "wechat-miniapp-devtools": {
        "command": "node",
        "args": ["<REPOSITORY_PATH>/scripts/run-mcp.js"],
        "env": {
          "MINIAPP_PROJECT_PATH": "<project-root>",
          "WECHAT_DEVTOOLS_CLI_PATH": "<wechat-devtools-cli-path>",
          "WECHAT_AUTOMATION_PORT": "9420"
        }
      }
    }
  }
}
```

Restart the ZCode session afterwards and check Settings → MCP for the connection state. The other skills in this repository (`skills/*/SKILL.md`) can be copied into `~/.zcode/skills/` the same way if you want the workflow guidance available in every workspace.

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
WECHAT_HTTP_PORT (optional; auto-discovered when unset)
WECHAT_AUTOMATION_PORT
MCP_PACKAGE_VERSION
```

## Agent workflow

1. Run preflight.
2. Start or reuse DevTools automation with `scripts/devtools-auto.js`.
3. Start the MCP server with `scripts/run-mcp.js`.
4. Call `miniprogram_connect` with the automation WebSocket port.
5. Read page state before interacting. If the first call right after connecting times out (10s built-in), the IDE is probably still loading the project — wait a few seconds and retry.
6. Use assertions and screenshots after important actions. Note `miniprogram_screenshot` only accepts a bare filename (no path separators; path-traversal validation) and writes it under `.mcp-artifacts/session-*/` in the MCP process working directory.
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
