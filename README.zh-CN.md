# 微信开发者工具 MCP 使用说明

本目录是通用版成果，适用于 Accio Work、WorkBuddy、Trae、Claude Desktop 及其他支持 stdio MCP 的 Agent 工具。

## 当前机器配置

当前机器的真实项目路径、微信开发者工具 CLI 路径和验证端口保存在本地的 `LOCAL_SETUP.zh-CN.md`，该文件被 `.gitignore` 忽略，不会提交到公开仓库。

通用配置请使用占位符，并按目标机器替换：

- 小程序项目根目录
- 微信开发者工具 CLI 路径
- 自动化 WebSocket 端口

两个端口不是一回事。MCP 的 `--automation-port` 必须指向自动化 WebSocket 端口。HTTP 服务端口在每次 IDE 重启后都会变化，因此在本项目中是**可选**的：不传 `--http-port` 时，`scripts/devtools-auto.js` 不会向 `cli auto` 转发 `--port`，由官方 CLI 自行定位正在运行的 IDE（与 `miniprogram-automator.launch` 行为一致），脚本还会从 IDE 的 `Default/.ide` 文件读出当前实际端口用于报告。只有并行运行多个 DevTools 实例需要钉死端口时才显式设置。

## 首次运行前机器检查清单

先确认这几点，再排查脚本本身：

1. 微信开发者工具已安装、已打开并登录。
2. 开发者工具 `设置→安全设置→服务端口` 已开启。对话框里显示的端口号每次重启都会变，不需要抄到任何配置里，脚本会自动探测；只有并行多实例时才需要显式指定。
3. 开发者工具 CLI 路径存在且可执行（Windows 上如 `F:\微信web开发者工具\cli.bat`，仅为示例）。
4. 小程序根目录直接包含 `project.config.json` 或 `app.json`。
5. Node.js 18+ 可用（MCP 配置里 `command` 可用绝对路径）。
6. 选定的自动化 WebSocket 端口若已被占用，脚本会复用现存会话而不是再起一个。
7. 首次运行需要能访问 npm registry；若先执行 `npm install`，`scripts/run-mcp.js` 会直接使用 `node_modules` 里的本地副本（可离线、启动更快、不再每次解析 registry）。

若显式传了过期的 `--http-port`，`cli auto` 仍会报 `must be restarted on port <requested> first`；不传该参数即可避免（见「当开发者工具已在运行」）。

## 切换/新增其他小程序项目

不同项目之间通常只需调整这些值：

| 需要变化的内容 | 配置位置 |
|---|---|
| 小程序项目根目录 | `--project-path` / `MINIAPP_PROJECT_PATH` |
| MCP 服务名（可选） | MCP 客户端配置里的服务 key |
| 自动化 WebSocket 端口 | `--automation-port` / `WECHAT_AUTOMATION_PORT`——并行运行的每个 DevTools 会话各用不同端口 |
| 开发者工具 HTTP 服务端口（可选） | `--http-port` / `WECHAT_HTTP_PORT`——仅并行钉死多实例时使用；省略时 CLI 自动发现正在运行的 IDE |

参考 `examples/multi-project.example.json` 的双项目配置。CLI 路径与仓库路径一般不变；目标项目需已在开发者工具中打开（或可被 CLI 打开），同一自动化端口同一时间只允许一个会话。切换项目只需用新值重启 `run-mcp.js`，脚本本身无需其他改动。

## 当开发者工具已在运行

`scripts/devtools-auto.js` 现在是幂等的。它先探测自动化 WebSocket 端口：

- 若端口上已有会话监听，输出 `reusing the existing session` 后直接以 0 退出，不触碰现存会话。这也是多个 Agent 排队共用一个 DevTools 实例时安全的原因。
- 若端口空闲，才执行 `cli auto --project <root> --auto-port <port>` 开启自动化。未显式设置 `--http-port`（或 `WECHAT_HTTP_PORT`）时不转发 `--port`，由 CLI 自行定位正在运行的 IDE，因此硬编码的服务端口过期也不会再触发 `IDE server has started on http://127.0.0.1:<actual> and must be restarted on port <requested> first`。

`scripts/preflight.js` 会报告从 IDE 的 `Default/.ide` 文件检测到的当前服务端口；若显式传入的端口与运行中的 IDE 不一致会被标记为过期。自动化端口已被占用会被报告为「可复用」而不是失败。

安全设置中的「服务端口」开关仍需打开，只是它的具体数值不再需要抄进任何配置。

## 启动示例

在本目录执行，替换尖括号中的值：

```powershell
node scripts/preflight.js    --project-path "<MINIAPP_PROJECT_PATH>" --cli-path "<WECHAT_DEVTOOLS_CLI_PATH>" --automation-port <auto-port>
node scripts/devtools-auto.js --project-path "<MINIAPP_PROJECT_PATH>" --cli-path "<WECHAT_DEVTOOLS_CLI_PATH>" --automation-port <auto-port>
node scripts/run-mcp.js       --project-path "<MINIAPP_PROJECT_PATH>" --cli-path "<WECHAT_DEVTOOLS_CLI_PATH>" --automation-port <auto-port>
```

只有需要并行钉死某个 DevTools 实例时才追加 `--http-port <port>`。

推荐顺序是先运行 `devtools-auto.js`，再让 Agent 启动 `run-mcp.js` 并调用 `miniprogram_connect(port=<auto-port>)`。已有自动化会话时不要重复 launch。当前机器的真实值请查看本地 `LOCAL_SETUP.zh-CN.md`。

## 在 Accio Work / WorkBuddy / Trae 中配置

1. 复制 `examples/mcp-config.example.json`。
2. 将 `<REPOSITORY_PATH>` 替换为本目录绝对路径。
3. 修改 `MINIAPP_PROJECT_PATH`。
4. 修改 `WECHAT_DEVTOOLS_CLI_PATH`。
5. 确认 `WECHAT_AUTOMATION_PORT`（`WECHAT_HTTP_PORT` 可选，仅并行多实例时需要）。
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
        "WECHAT_AUTOMATION_PORT": "37735"
      }
    }
  }
}
```

如果客户端无法识别 `node`，请将 `command` 改成 Node.js 的绝对路径，例如 `C:/Program Files/nodejs/node.exe`。

## 在 ZCode 中配置

ZCode 从用户级配置 `~/.zcode/cli/config.json` 或工作区配置 `<repo>/.zcode/config.json` 的 `mcp.servers` 键读取 MCP 服务，并在会话启动时自动连接。复制 `examples/mcp-config.zcode.json` 并合并进目标配置文件：

```json
{
  "mcp": {
    "servers": {
      "wechat-miniapp-devtools": {
        "command": "node",
        "args": ["<REPOSITORY_PATH>/scripts/run-mcp.js"],
        "env": {
          "MINIAPP_PROJECT_PATH": "<project-root>",
          "WECHAT_DEVTOOLS_CLI_PATH": "<wechat-devtools-cli-path>",
          "WECHAT_AUTOMATION_PORT": "37735"
        }
      }
    }
  }
}
```

保存后重启 ZCode 会话，在 设置→MCP 中确认连接状态。需要工作流指引时，可把本仓库 `skills/*/SKILL.md` 复制到 `~/.zcode/skills/` 下，即可在所有工作区生效。

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

## 交接给其他 Agent

分两档——清单是**上限不是每次下限**。

**A 档：对方与本机同一个 Agent 环境（能读本仓库与本机文件）。** 三样就够：

```text
使用 <REPOSITORY_PATH> 这套本地微信开发者工具自动化方案，
操作小程序项目 <PROJECT_ROOT>。
功能目标：<要开发/验证什么，以及验收路径>。
```

CLI 路径、服务端口、自动化端口、DevTools 状态由对方自己从本仓库与本机配置笔记读取、自行探测端口补齐；唯一可能需要你口头纠正的是本机路径是否迁移过（例如 DevTools 换了安装盘）。

**B 档：对方读不到本机文件（云端 Agent、远程机器、或不保证读仓库）。** 把完整配置整段给出：项目根目录、DevTools CLI 路径、安全设置中「服务端口」显示号、自动化 WebSocket 端口、验收路径、以及下方安全红线。此档不要省略任何一项。

## 常见问题

- 端口被占用：先检查旧 MCP 进程和微信开发者工具自动化会话，不要并发启动多个探测进程。
- `cli.bat` 找不到：检查 `WECHAT_DEVTOOLS_CLI_PATH`。
- 项目找不到：确认填的是小程序根目录，不是外层 monorepo 或后端目录。
- 连接成功但看不到页面：先调用 `miniprogram_get_page_stack`，再调用截图工具。
- 截图超时：同一会话串行截图，清理残留 MCP 进程后重新连接。

## 安全要求

不要提交 `project.private.config.json`、AppSecret、Cookie、Token 或任何私有项目数据。公开仓库只包含通用脚本、模板和文档。
