---
name: devtools-automation
description: Connect an Agent to local WeChat DevTools through MCP, navigate Mini Program pages, inspect elements, and recover from automation failures.
version: 1.0.0
---

# DevTools Automation

Use this skill when a task needs WeChat DevTools control, page interaction, screenshots, or rendered UI validation.

## Required order

1. Run `scripts/preflight.js`.
2. Start or reuse DevTools automation with `scripts/devtools-auto.js`.
3. Start `scripts/run-mcp.js` and call `miniprogram_connect` with the automation WebSocket port.
4. Read the page stack before navigation or interaction.
5. Use stable selectors, wait for rendering, assert state, then screenshot.
6. Disconnect the MCP session without unnecessarily closing DevTools.

## Port rule

WeChat DevTools `--port` is the HTTP service port. `--auto-port` is the automation WebSocket port. The MCP `--port` argument must be the automation port. Never conflate the two.

## Recovery

- Project not found: verify the project root contains `project.config.json` or `app.json`.
- Connection refused: verify DevTools security settings and the automation port.
- Port in use: reuse the existing session or select a different automation port; do not launch parallel MCP probes.
- Windows launch failure: start automation through the official CLI wrapper, then use MCP `connect` instead of repeatedly calling MCP `launch`.
- Screenshot timeout: serialize screenshots, clear stale MCP processes, and reconnect once.

Never request or expose credentials, AppSecrets, cookies, or tokens.
