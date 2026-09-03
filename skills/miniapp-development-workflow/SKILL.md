---
name: miniapp-development-workflow
description: Develop WeChat Mini Programs through source changes, compilation, DevTools automation, behavioral assertions, and visual verification.
version: 1.0.0
---

# Mini Program Development Workflow

1. Inspect the project root, package scripts, page structure, and existing conventions.
2. Make the smallest source change that satisfies the request.
3. Run the project's existing build, type-check, or test commands.
4. Start or connect WeChat DevTools automation.
5. Read the page stack and wait for rendering.
6. Exercise the requested user flow with stable selectors.
7. Assert state and capture screenshots at important checkpoints.
8. Report changed files, commands, assertions, screenshots, and environment limits.

Do not treat a successful build as proof that the rendered UI or behavior is correct.
