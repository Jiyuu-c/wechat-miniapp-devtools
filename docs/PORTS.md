# WeChat DevTools Port Model

The WeChat DevTools CLI exposes separate services:

```text
--port       HTTP service port
--auto-port  Mini Program automation WebSocket port
```

Example:

```text
cli.bat auto --project <project-root> --port 37733 --auto-port 37735
```

The MCP server must receive the automation WebSocket port through its `--port` argument or `WECHAT_AUTOMATION_PORT` environment variable. It must not receive the HTTP service port.

Only one active project session should use a given automation port. For concurrent projects, run separate DevTools instances with separate HTTP and automation ports.
