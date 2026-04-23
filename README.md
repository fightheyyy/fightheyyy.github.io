# Fightheyyy.github.io

fightheyyy 的技术博客首页，布局参考 GitHub Profile，用于记录 AI Agent、记忆系统、写作平台和工程实践。首页使用原生 JS 打字机背景，`XiaoBa-CLI` 项目栏使用从 `XiaoBa-OS` 前端移植的黑金 WebGL 猫头动态背景，`GauzMem` 使用原生 WebGL2 Metaballs 背景，`Vibe Writing Platform` 使用轻量 Canvas Hyperspeed 光轨背景。项目是纯静态站点，可以直接用 GitHub Pages 托管。

## 文件

- `index.html`: 技术博客首页内容和页面结构。
- `styles.css`: 页面视觉样式、响应式布局和动效。
- `script.js`: `XiaoBa-CLI` 项目栏里的原生 WebGL 小猫背景，移植自 `XiaoBa-OS/src/components/CatOrb`。

## 部署到 GitHub Pages

1. 把这个目录推送到名为 `Fightheyyy.github.io` 的 GitHub 仓库。
2. 进入仓库 `Settings` -> `Pages`。
3. Source 选择 `Deploy from a branch`。
4. Branch 选择 `main`，目录选择 `/root`。

如果仓库名不是 `Fightheyyy.github.io`，也可以在普通仓库里启用 Pages，访问地址会是 `https://你的用户名.github.io/仓库名/`。
