# galworld-hot

《寄托心意的天空 · 2018》角色卡的热更新资源仓库。

| 目录 | 文件 | 用途 |
|---|---|---|
| `opening/` | `opening.js` + `opening.manifest.json` | 开局前端（GALWORLD · 世界之书） |
| `dialogue/` | `dialogue.js` + `dialogue.manifest.json` | 对白美化 CSS 注入器 |
| `status/` | `status.html` + `status.manifest.json` | 状态面板 |
| `.github/workflows/` | 三个 `update-*-manifest.yml` | push 内容文件后自动重算 sha256 |

> 默认分支是 `main`；如果仓库用 `master`，所有链接里的 `main` / `@main` 都要改。

## 更新流程

1. 直接在 GitHub 上改对应的 `opening/opening.js`、`dialogue/dialogue.js` 或 `status/status.html`。
2. 提交（Commit changes）。
3. GitHub Actions 会自动重算 SHA-256、更新对应的 `*.manifest.json` 并提交回来。
   不需要本地跑脚本。

> 第一次使用前：仓库 Settings → Actions → General → Workflow permissions
> 选 **Read and write permissions**，否则 Action 没有权限提交 manifest。
>
> Workflow 只改 `sha256` 和 `updatedAt`，不会动 `version` / `engine`。
> 对白脚本内部 `VERSION` 变化时，手动把 `dialogue.manifest.json` 的 `engine` 改成新值。

卡里的加载器每次开聊天都会先拉 `*.manifest.json`（几百字节），
只有 `sha256` 变了才下载正文；下载后会再校验一次 SHA-256。

> manifest 里的 `script` / `html` 必须和文件名完全一致，加载器会校验。
> `abi` 是给未来不兼容改动留的闸门，现在固定为 1。

## 镜像

加载器会同时尝试（先到先得）：

1. `https://raw.githubusercontent.com/jianchi89/galworld-hot/main`
2. `https://fastly.jsdelivr.net/gh/jianchi89/galworld-hot@main`
3. `https://gcore.jsdelivr.net/gh/jianchi89/galworld-hot@main`
4. `https://cdn.jsdelivr.net/gh/jianchi89/galworld-hot@main`

jsDelivr 对分支文件有约 12 小时缓存；更新后如果发现远端没变，可以访问
`https://purge.jsdelivr.net/gh/jianchi89/galworld-hot@main/opening/opening.manifest.json`
（三个 manifest 各刷一次）强制刷新。
