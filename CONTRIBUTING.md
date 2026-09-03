# Contributing

Keep the repository portable and provider-neutral.

- Do not commit machine-specific absolute paths.
- Do not commit tokens, cookies, AppSecrets, private project config, or generated screenshots.
- Keep HTTP and automation WebSocket ports separate.
- Prefer environment variables and command-line arguments over hard-coded paths.
- Test scripts on the target platform before changing MCP startup behavior.
- Document compatibility assumptions and external dependency versions.
