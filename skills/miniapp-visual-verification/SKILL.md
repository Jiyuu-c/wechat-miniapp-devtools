---
name: miniapp-visual-verification
description: Verify rendered WeChat Mini Program screens with page state, element assertions, reproducible actions, and screenshots.
version: 1.0.0
---

# Mini Program Visual Verification

Use a real local DevTools automation session. Capture a baseline, perform the requested actions serially, assert visible state, and capture a result screenshot.

Report:

```text
Connection: pass/fail
Page: <route>
Actions: <ordered actions>
Assertions: <expected and actual values>
Screenshot: <path or attachment>
Conclusion: pass/partial/fail
Limits: <window, login, mock, or simulator limitations>
```

A screenshot alone is not proof of behavior. Do not claim real-device, review-environment, or production validation from a DevTools simulator.
