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
- Network access the first time npm downloads `@creatoria/miniapp-mcp@0.2.3`.

## Quick start

From this repository:

```bash
node scripts/preflight.js --project-path /path/to/miniprogram --cli-path /path/to/cli.bat --http-port 37733 --automation-port 37735
node scripts/devtools-auto.js --project-path /path/to/miniprogram --cli-path /path/to/cli.bat --http-port 37733 --automation-port 37735
node scripts/run-mcp.js --project-path /path/to/miniprogram --cli-path /path/to/cli.bat --automation-port 37735
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

## Security and scope

This project does not bypass WeChat login, project permissions, AppSecret protection, or DevTools security settings. Never commit tokens, cookies, AppSecrets, private project configuration, or machine-specific secrets.

The DevTools simulator is not a substitute for real-device, review-environment, or production validation.

## License

MIT. See [LICENSE](LICENSE).
