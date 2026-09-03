# 微信开发者工具 MCP 使用说明

本目录是通用版成果，适用于 Accio Work、WorkBuddy、Trae、Claude Desktop 及其他支持 stdio MCP 的 Agent 工具。

## 当前机器配置

当前机器的真实项目路径、微信开发者工具 CLI 路径和验证端口保存在本地的 `LOCAL_SETUP.zh-CN.md`，该文件被 `.gitignore` 忽略，不会提交到公开仓库。

通用配置请使用占位符，并按目标机器替换：

- 小程序项目根目录
- 微信开发者工具 CLI 路径
- HTTP 服务端口
- 自动化 WebSocket 端口

两个端口不是一回事。MCP 的 `--automation-port` 必须指向自动化 WebSocket 端口。

## 启动示例

在本目录执行，替换尖括号中的值：

```powershell
node scripts/preflight.js --project-path "<MINIAPP_PROJECT_PATH>" --cli-path "<WECHAT_DEVTOOLS_CLI_PATH>" --http-port 37733 --automation-port 37735
node scripts/devtools-auto.js --project-path "<MINIAPP_PROJECT_PATH>" --cli-path "<WECHAT_DEVTOOLS_CLI_PATH>" --http-port 37733 --automation-port 37735
node scripts/run-mcp.js --project-path "<MINIAPP_PROJECT_PATH>" --cli-path "<WECHAT_DEVTOOLS_CLI_PATH>" --automation-port 37735
```

推荐顺序是先运行 `devtools-auto.js`，再让 Agent 启动 `run-mcp.js` 并调用 `miniprogram_connect(port=37735)`。已有自动化会话时不要重复 launch。当前机器的真实值请查看本地 `LOCAL_SETUP.zh-CN.md`。

## 在 Accio Work / WorkBuddy / Trae 中配置

1. 复制 `examples/mcp-config.example.json`。
2. 将 `<REPOSITORY_PATH>` 替换为本目录绝对路径。
3. 修改 `MINIAPP_PROJECT_PATH`。
4. 修改 `WECHAT_DEVTOOLS_CLI_PATH`。
5. 确认 `WECHAT_HTTP_PORT` 和 `WECHAT_AUTOMATION_PORT`。
6. 将 JSON 粘贴到对应工具的自定义 MCP JSON 配置中。

通用示例：

```json
{
  "mcpServers": {
    "wechat-jbus-mall-mini": {
      "command": "node",
      "args": ["<REPOSITORY_PATH>/scripts/run-mcp.js"],
      "env": {
        "MINIAPP_PROJECT_PATH": "<project-root>",
        "WECHAT_DEVTOOLS_CLI_PATH": "<wechat-devtools-cli-path>",
        "WECHAT_HTTP_PORT": "37733",
        "WECHAT_AUTOMATION_PORT": "37735"
      }
    }
  }
}
```

如果客户端无法识别 `node`，请将 `command` 改成 Node.js 的绝对路径，例如 `C:/Program Files/nodejs/node.exe`。

## 选择特定项目

一个 MCP 服务通过 `MINIAPP_PROJECT_PATH` 绑定一个项目。建议每个项目使用一个服务名：

- `wechat-jbus-mall-mini`
- `wechat-fuji-visibility`
- `wechat-hanabi-mini-program`

切换项目时：

1. 结束当前 MCP 会话。
2. 关闭或退出当前微信开发者工具项目会话，或用官方 CLI 打开目标项目。
3. 使用目标项目的 MCP 服务。
4. 确保同一自动化 WebSocket 端口没有被多个项目并行占用。

新增项目时，只需复制一个 MCP 服务配置块，修改服务名和 `MINIAPP_PROJECT_PATH`。项目根目录必须直接包含 `project.config.json` 或 `app.json`。

## 常见问题

- 端口被占用：先检查旧 MCP 进程和微信开发者工具自动化会话，不要并发启动多个探测进程。
- `cli.bat` 找不到：检查 `WECHAT_DEVTOOLS_CLI_PATH`。
- 项目找不到：确认填的是小程序根目录，不是外层 monorepo 或后端目录。
- 连接成功但看不到页面：先调用 `miniprogram_get_page_stack`，再调用截图工具。
- 截图超时：同一会话串行截图，清理残留 MCP 进程后重新连接。

## 安全要求

不要提交 `project.private.config.json`、AppSecret、Cookie、Token 或任何私有项目数据。公开仓库只包含通用脚本、模板和文档。
