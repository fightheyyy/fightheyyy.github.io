---
title: "XiaoBaCLI 2 XiaoBaOS"
description: "从 CLI 接到飞书后，长任务会阻塞对话，多个 Subagent 会同时发消息，生成的文件也未必送到了用户手里。这篇记录 xiaobaOS 怎样逐项处理这些问题，再补上回归评测。"
date: "2026-07-17"
author: "Fightheyyy"
category: "Agents"
tags: ["Agent Runtime","Engineering Retrospective"]
featured: false
draft: false
readingMinutes: 10
---

xiaobaCLI 最初参考了 Coding Agent 的形态：搭好 Agent Loop 和 Base Tools，让模型能在工作目录里读文件、跑命令、完成任务。接入飞书后，用户会在长任务运行时继续发消息，还需要拿到真正送达的文件。很多后来的改动，都是为了解决这些问题。

## CLI 和飞书是一起做起来的

基础 CLI 出现后，Session、Context 压缩和第一个飞书入口几乎同时加进来。工具调用需要连续执行，多轮消息也需要保存状态。微信入口是后来才加的。

工程咨询里已有报告生成、资料检索、图表生成和图纸分析能力，我把它们封装成 Skill。生物信息场景里，则把企业已有的 Python、R 脚本参数化，让 Agent 组织参数，按固定流程调用。业务算法继续用原来那套。

所以前期是一边补执行能力，一边在飞书里使用。CLI 中习惯的交互方式，很快就不够用了。

## 长任务运行时，用户还会继续发消息

用户会在 IM 里追问进度、补充条件，也会要求停止。如果长任务一直占着主会话，就处理不了这些消息；把工具日志全部发出来，又会让聊天窗口不断刷屏。

| CLI 的默认假设 | IM 中的真实问题 | Runtime 必须补上的能力 |
| --- | --- | --- |
| 一次命令对应一个完整任务 | 用户消息碎片化，还会持续补充和追问 | 持久会话与消息队列 |
| 长任务可以占住当前终端 | 后台任务不能阻塞主对话 | 独立 Subagent Session |
| 执行过程可以直接打印 | 工具过程会刷屏，破坏“同事感” | Main Agent 统一对外交互 |
| 生成最终文本就算结束 | 文本和文件可能根本没有送到用户手里 | 显式交付与 Delivery Evidence |

## 把长任务拆出去后，又改了一次消息出口

原来的执行链很简单，也很容易阻塞：

```text
User → CLI Agent → long tool loop → final answer
```

第一步是加入异步 Subagent，把长任务移出主会话。但早期实现仍允许 Subagent 直接向飞书发送消息和文件。阻塞缓解了，新的问题却出现了：Main Agent 和多个 Subagent 都能对外说话，用户会收到多出口消息，交付权也变得模糊。

```text
User → Main Agent → Subagent
          │              │
          └── reply ─────┴── send text / file → User
```

随后我才把架构收敛为 Main Agent 唯一用户出口：Subagent 负责后台执行，完成通知把最终结果和产出文件路径回注主会话，再由 Main Agent 组织交付。

```text
User ↔ Main Agent
          │
          ├─ 直接处理短任务
          │
          └─ spawn → independent Subagent Session
                         ↓
                 tools / files / context
                         ↓
             resultSummary + outputFiles
                         ↓
Main Agent → send_text / send_file → User
```

在当前架构中，Main Agent 是唯一用户交互入口，也是任务编排器。短任务由它直接完成；长任务进入独立 Subagent Session。Subagent 与 Main Agent 复用同一套 Agent Loop 和工具边界，但拥有独立会话与执行上下文；后续证据系统又为 Subagent 补上了独立 Trace。主会话在后台任务运行时仍能响应用户，也可以查询或发出停止指令。

`send_text` 和 `send_file` 决定哪些内容真正发给用户。模型生成 final text 后，默认不会自动外发。发送结果保存为 Delivery Evidence；平台返回消息或文件确认时，再附上 External Delivery Receipt。

但停止任务仍有边界：已经发生的外部写操作无法撤回，跨进程恢复也还没做完整。当前可以关闭 Runtime 会话、阻止迟到结果回注；Provider、Shell 或脱管子进程能否立即停止，要看 Adapter 有没有正确传递 AbortSignal。

## 从硬编码 Agent 到 Role / Skill 分层

早期版本已经有 Plan Agent、Explore Agent、Bash Agent、Code Reviewer 等硬编码类型，同时 Skills 也在不断增长。它们能工作，但每增加一种职责，都可能复制一组类、Prompt 和工具配置。随着工程咨询、生物信息、浏览器操作和办公协同能力继续增加，我才把它收敛成“共享一个 Runtime、用声明式 Role 定义职责、用 Skill 挂载领域流程”的结构：

| 层次 | 负责什么 | 不负责什么 |
| --- | --- | --- |
| Runtime | Agent Loop、Session、Context、Tool 执行、异常与交付 | 具体行业流程 |
| Role | 职责、Prompt、工具权限和可挂载能力 | 复制一套新的 Agent 内核 |
| Skill | 渐进披露的领域流程、规则与配套脚本 | 绕过 Runtime 权限和证据边界 |
| Tool / Driver | 文件、浏览器、桌面与办公平台的确定性动作 | 替 Agent 做业务判断 |

Researcher Role 就来自我长期写论文时用的一组流程：检索文献、设计实验、保存结果、编写 LaTeX、生成 PDF 和制作汇报材料。它是我手工整理的，当时还没有完整的候选验收链。

角色和流程能复用之后，还要检查后续修改会不会破坏它们。换了模型、Prompt 或 Skill，原来跑通的任务需要再跑一遍。

## 用 Trace 留下过程，再用 Replay 重跑

企业试点后，稳定性成了更明显的问题。同一个任务的结果会受模型采样、上下文、工具响应和环境影响，需要把运行过程保存下来，才能比较前后版本。

我把原来混在一起的历史拆成四种用途：Conversation Journal 保存用户可见对话，Durable Session 保存恢复状态，Provider Transcript 是实际发给模型的内容，Trace 记录本轮工具、Subagent、产物、异常和交付。历史兼容路径上还没完全分开，但后续实现按这四种用途组织。

在此基础上，回归链路收敛为：

```text
Case + Oracle
      ↓
Replay current Runtime
      ↓
fresh Trace
      ↓
deterministic Verifier
      ↓
ReviewerCat semantic judge
      ↓
Outcome: pass / fail / blocked
```

Replay 的职责只是重新执行 Case 并产生 fresh Trace，不负责宣布成功。Verifier 按 Case 声明检查 Registry 已支持的硬事实；当前默认覆盖 Trace 是否存在、Tool 是否失败和只读边界，Artifact 或 Delivery 检查需要由具体 Case 显式配置。硬检查通过后，ReviewerCat 才判断语义质量。确定性规则负责事实，语义评审负责开放式质量，两者不能互相越权。

## 再用模拟用户找没写进 Case 的问题

固定 Case 通常只能覆盖已经想到的问题。为了补充模糊表达、背景缺失和中途改要求等情形，我加了 Arena：UserCat 按 Scenario 与被测 Agent 多轮互动，InspectorCat 再从 Trace 提取可以复现的 Finding 和 Case。

```text
Scenario
   ↓
UserCat ↔ Subject Agent
   ↓
standard Trace
   ↓
InspectorCat → Finding + Case
                    ↓
              shared Evaluation
```

Arena 初版还管 Scorecard、Candidate 验收和可选发布，与 Evaluation 和自进化重复。我后来删掉独立 Scorecard Worker、人工 Promotion 和重复的 Replay 路径。现在 Arena 负责发现问题，新 Case 仍走共享 Evaluation，发布由自进化控制层处理。

## 生成的新能力，先验收再启用

xiaobaCLI 很早就出现过名为 self-evolution 的 Skill：它可以生成新的 Skill 和 Python Tool，但会直接写入生产目录。那时的“进化”只证明系统会生成能力，没有回答生成物是否正确、是否优于当前版本、失败后如何保持生产版本不变。

后来我才把“生成”与“发布”拆开，并把当前 xiaobaOS 收敛为一条轻量控制链：Trace 先由 InspectorCat 形成 Finding 和可执行 Case；已经存在的失败 Case 则直接进入 Candidate 生成，不再重复检查，也不会把 Replay Trace 递归送回 Inspector。

```text
Trace → InspectorCat → Finding + executable Case ─┐
Existing failed Case ─────────────────────────────┤
                                                  ↓
                                           Candidate owner
                                      ├─ EngineerCat: code
                                      └─ EvolutionCat: Role / Skill
                                                  ↓
                                             shared Test
                                                  ↓
                                             shared Eval
                                                  ↓
                                          atomic activation
```

Test 负责代码和契约，Eval 负责 Agent 行为。两者全部通过后，Role / Skill Candidate 只对新 Session 生效，代码 Candidate 只由下一进程加载；失败、blocked 或激活异常都保持当前版本不变。运行中的 Session 不热更新能力版本，因为同一条 Trace 前后使用两套行为，会让问题无法解释，也让 Replay 失去版本依据。

这条链解决的是候选怎么验收和启用。它能不能带来长期收益，还要用更多线上 Trace、独立 Case 和跨版本结果来判断。

## 为什么后来叫 xiaobaOS

项目逐渐接管了入口、会话、后台任务、角色、技能、交付和评测，我就把它改名为 xiaobaOS。之后仍在调整结构：Arena 收缩职责，Test / Eval 合并复用，几种状态也继续拆分。下面这个操作系统类比，只是帮助说明各部分的分工。

| 计算机系统 | xiaobaOS | 核心职责 |
| --- | --- | --- |
| CPU | Models | 推理、规划与生成 |
| 设备与 I/O | Tools / Drivers | 执行确定性外部动作 |
| 进程与调度 | Main Agent / Subagent Sessions | 建立独立会话并协调前后台工作 |
| 应用与权限 | Roles / Skills | 组织职责、工具权限与领域流程 |
| 日志、测试与发布 | Trace / Test / Eval / Arena / Evolution | 保存事实、发现问题并约束变化 |

这个类比也有清晰边界：xiaobaOS 不是通用操作系统，不提供内核级进程隔离，也不是分布式任务平台。更准确地说，它是一套本地优先、面向消息场景的 Agent Harness Runtime 与控制面。

## 还没有解决的问题

写这篇时，维护中的真实 Agent CaseSet 只有 3 条只读 Case，主要用来检查共享评测流程，还覆盖不了广泛能力。需要写工作区的 Replay 和 Source Candidate 原生沙箱只在 macOS 可用，其他平台会 fail closed。

运行中的 Subagent 尚未完成完整的跨进程恢复；外部写操作的幂等与完成态仍依赖具体 Tool Server 的能力；Arena 和 Reviewer 的价值也取决于 Scenario、Case 与 Judge 本身是否可信。这些都是当前边界，而不是一句“可治理自进化”可以省略的工程问题。

后续要补的仍是这些具体问题：让后台任务能恢复，检查文件和消息有没有交付，再增加足够的 Case 验证版本变化。名字已经改了，工作还得一项项做。

---

[查看原版文章及交互图表](/classic/posts/xiaoba-cli-agent-os.html)
