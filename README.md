# Fightheyyy.github.io

Fightheyyy 的个人技术主页与技术博客，关注 Agent Harness、Agentic Eval，以及面向具身机器人的 Voice Agent Harness。

首页是一个连续滚动的纯静态个人索引：名字、自我定位、项目链接、文章链接，以及 GitHub、小红书和邮箱联系方式。没有头像、顶部导航、强制分页、项目卡片或首页 Canvas。自托管的 Syne 可变字体、轮廓式 `yyy` 和非对称编辑排版构成全站视觉识别；四篇长文复用相同的签名页头和标题轴，正文仍使用高可读的系统字体。JavaScript 只提供简短的名字与区块进入动效，关闭 JavaScript 后内容和链接仍然完整可用。

## 文件

- `index.html`: 个人主页的内容、语义结构和链接。
- `posts/xiaoba-cli-agent-os.html`: XiaoBa-CLI Agent OS 技术文章。
- `posts/supercoding-agent-engineering.html`: SuperCoding 架构优先的 Agent 工程方法文章。
- `posts/gauzmem-three-path-memory.html`: GauzMem 可追溯记忆与三路召回技术文章。
- `posts/barena-agent-release-ci.html`: Barena 从 Agent Eval 到发布 CI 的技术观点文章。
- `styles.css`: 首页与四篇文章共享的白色编辑式视觉系统、签名页头和响应式布局。
- `script.js`: 首页名字动效、区块进入和低动态降级。
- `assets/fonts/`: 首页展示字体及其开源许可证，部署时无需运行时字体 CDN。
- `assets/posts/`: 有视觉资源的文章各自作用域内的图片与交互文件。

SuperCoding 的 Canvas 交互保留在文章作用域内，并以浅色编辑插图呈现，不会在文章入口切换成另一套深色主题。

## 本地预览

```bash
python3 -m http.server 4173 --bind 127.0.0.1
```

打开 `http://127.0.0.1:4173/`。

## 部署到 GitHub Pages

1. 把这个目录推送到名为 `Fightheyyy.github.io` 的 GitHub 仓库。
2. 进入仓库 `Settings` -> `Pages`。
3. Source 选择 `Deploy from a branch`。
4. Branch 选择 `main`，目录选择 `/root`。

如果仓库名不是 `Fightheyyy.github.io`，也可以在普通仓库里启用 Pages，访问地址会是 `https://你的用户名.github.io/仓库名/`。
