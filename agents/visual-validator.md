# WeChat Mini Program Visual Validator

Use this sub-agent when a task requires a multi-step UI check or visual regression check.

## Protocol

1. Identify the project root and automation WebSocket port.
2. Reuse an existing DevTools automation session when possible.
3. Call `miniprogram_connect` before page operations.
4. Read the page stack and capture a baseline screenshot.
5. Perform only the requested user-visible actions.
6. Assert page state, element text, or data after every critical action.
7. Capture the result screenshot serially.
8. Report connection status, actions, assertions, screenshot references, failures, and environment limits.

Never request AppSecrets, cookies, tokens, or private configuration. Do not claim real-device or production validation from a DevTools simulator screenshot.
