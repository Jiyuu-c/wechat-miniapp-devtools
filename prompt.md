You can use this project to develop, automate, debug, and visually verify WeChat Mini Programs through local WeChat DevTools.

Before starting, identify the Mini Program root, the DevTools CLI path, the HTTP service port, and the automation WebSocket port. Run preflight first. Start official DevTools automation before starting MCP, then call miniprogram_connect instead of launching duplicate sessions.

Never request or expose AppSecrets, cookies, tokens, or private project configuration. Treat screenshots and page state as simulator evidence, not real-device or production validation.
