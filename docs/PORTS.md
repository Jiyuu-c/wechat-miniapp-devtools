# WeChat DevTools Port Model

The WeChat DevTools CLI exposes separate services:

```text
--port       HTTP service port
--auto-port  Mini Program automation WebSocket port
```

The MCP server must receive the automation WebSocket port through its `--port` argument or `WECHAT_AUTOMATION_PORT` environment variable. It must not receive the HTTP service port.

## HTTP service port lifetime

The HTTP service port is randomized on every IDE start and must be re-enabled once in Settings → Security Settings → Service Port. The IDE writes the current value to `<user data>/<profile>/Default/.ide`, and the official `miniprogram-automator.launch` never forwards `cli auto --port`, letting the CLI discover the running IDE by itself.

This project follows that behavior:

- Omit `--http-port` / `WECHAT_HTTP_PORT` (default): `scripts/devtools-auto.js` runs `cli auto --project <root> --auto-port <port>` without `--port`, so a stale hard-coded port cannot abort the call.
- Set it explicitly only when pinning parallel DevTools instances, for example:

```text
cli.bat auto --project <project-root> --port 24489 --auto-port 37735
```

`scripts/preflight.js` reports the currently detected service port and flags an explicit one that no longer matches the running IDE.

## Automation port

Only one active project session should use a given automation port. `scripts/devtools-auto.js` probes the port first and reuses a live session instead of starting a second one; for concurrent projects, run separate DevTools instances with separate automation ports.
