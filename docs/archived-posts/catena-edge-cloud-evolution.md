---
title: "Catena：我为什么把 Agent 进化拆成端和云"
description: "Barena 做完一轮评测后，我还想知道同一种错误有没有反复出现。Catena 把多次运行记录放到云端分析，候选改动则回到 Agent 原来的环境验收。"
date: "2026-08-11"
author: "Fightheyyy"
category: "Agents"
tags: ["Agent Infrastructure","Edge","Cloud"]
featured: false
draft: false
readingMinutes: 11
---

做 Barena 时，一次测试的 Trace 和结果都留在本地。我接着想看更长时间里的变化：同一种错误有没有反复出现，修复之后又有没有回来。Catena 就是从这里开始的。

最初我考虑过继续做本地工具，也考虑过把 Agent 托管到云上。前者需要补上跨 Run 的保存与分析；后者需要搬走用户的仓库、文件、密钥和执行环境，接入工作会多得多。

最后我把两边的工作拆开：Agent 留在原来的机器上运行，云端保存运行记录、分析重复问题。云端生成的候选改动，再送回原环境测试。

Execution **目标 Agent 留在用户环境**

Evidence **按 Agent 长期保存 Trace 与对话**

Evolution **候选在云上产生，变化在端上验证**

## 观测、评测和改进，分别做什么

我一开始把查看 Trace、运行评测、生成改进建议都放在一起考虑。实际需要先分清它们各自产出什么：

| 层次 | 回答的问题 | 产物 |
| --- | --- | --- |
| Observability | 这一次运行发生了什么？ | Trace、Span、错误、耗时 |
| Evaluation | 目标任务有没有真实完成？ | Case、Verifier、回归结论 |
| Evolution | 重复问题应该怎样改变 Agent？ | agent.md、Skill、Role、Harness |

Barena 已经负责运行任务和验证结果，Catena 要补的是跨多次运行的分析。为此，每个候选改动都要能查到它来自哪些 Trace，以及它准备解决什么问题。

## Agent 留在原来的环境里

如果 Agent 通过 HTTP Endpoint 提供服务，云端可以直接调用。但开发者机器上的 Agent 往往还依赖仓库、终端权限、本地 Skills、浏览器或内网资源，迁移这些条件并不轻松。

把这些环境一一复刻到云上，需要维护远程开发环境、密钥和容器调度。测试环境也会跟着变化：云端沙箱里跑通，未必说明原来机器上的问题已经修好。

所以被测 Agent 继续在原环境运行。Catena 内置的 XiaoBaOS Evolution Runtime 只读取 Evidence Pack 做分析，目标任务仍由用户环境中的 Agent 执行。

## 云端用来积累多次运行记录

本地当然也能长期保存和分析日志。不过，围绕一次命令生成的报告，不方便继续追踪一个月里的重复失败，或者比较多个版本。Catena 把这部分做成长期服务，按 Agent 和时间组织记录。

输入也不限于测试：日常使用产生的 Trace 同样可以上传。云端按 Agent 聚合，固定一次分析的时间窗口，再从多条运行里寻找重复模式。这样不必等开发者先把问题写成 Case。

## 数据怎样往返

Edge · 用户环境 / CI

**目标 Agent** XiaoBaOS · Codex · Claude Code · Claw

**Barena E2E Engine** 模拟用户探索 · Case 回放 · 版本对比 · Verifier

**当前 Run 证据** OTLP Trace · Artifact · Run Bundle

**OTLP / HTTPS  
Evidence →  
← Candidate** →

Cloud · Catena

**Go Control Plane** 身份 · Agent · API Key · Job · 审计

**Evidence Store** PostgreSQL 业务事实 · ClickHouse Span

**Evolution Runtime** 发现问题 · 生成候选 · 证据评审

```text
真实使用 / E2E Run
        ↓
OTLP Trace + Conversation + Run Bundle
        ↓
按 Agent 与时间窗口冻结 Evidence
        ↓
发现重复问题 → 生成候选资产 → 证据评审
        ↓
agent.md / Skill / Role / Harness
        ↓
回到本地 Replay 与 Verifier
        ↓
采用、拒绝，或继续观察
```

生成候选之后，还要回到目标环境 Replay，并检查 Verifier 结果。分析 Agent 对改动的评价可以辅助判断，但无法代替这一步运行。

## OTLP 接收记录，Adapter 负责执行

跨 Runtime 接入需要分别处理两件事。观测数据可以通过 OpenTelemetry 的 OTLP 协议上传，前提是 Runtime 导出了相应的模型调用、工具调用、耗时和错误。

启动 Agent、续接 Session、取消任务和读取 Artifact 仍然各有差异。它们由 Barena 的 Agent Adapter 处理。Catena 接收长期记录，Barena 负责在端侧执行任务。

`Runtime → OTLP → Catena`

统一观测和跨 Run 分析，不要求平台理解每个 Runtime 的启动方式。

`Barena → Agent Adapter → Runtime`

统一 Explore、Replay、Compare 和取消语义，保留本地执行能力。

## 工具记录和用户对话分开保存

接 XiaoBaOS 时，我曾想把所有东西都放进 Trace。但工具调用、异常重试和用户对话混在一起，会分不清哪些内容只是内部过程，哪些消息真的发给了用户。

因此 Trace 用来分析工程问题；用户发出的消息、成功送达的文本和文件另走对话路径，用于记忆和角色知识。隐藏 Prompt、内部推理和 Tool Result 不写成与用户共同经历的事情。

```text
OTLP Trace
  → Tool / Runtime / Harness 分析
  → agent.md · Skill · Role · Harness

User-visible Conversation
  → GauzMem 记忆编译
  → semantic · graph · temporal memory
```

比如发送工具被调用，只说明 Agent 尝试过发送。只有拿到送达结果，才可以把它记作用户已经收到的消息。

## 上传的 Trace 属于哪个 Agent

同一台电脑上可能同时出现 `codex-app-server` 和 `Codex Desktop` 这样的服务名，名字还会随版本变化。直接用 `service.name` 作为 Agent 身份，列表里就容易出现重复或陌生的条目。

Catena 改成先创建 Agent，再生成与它绑定的 API Key。上传时，Key 决定稳定的 `agent_id`；Runtime 类型从证据自动识别，只作为展示信息，客户端不能靠改 payload 把数据写到另一个 Agent 名下。

```text
Agent name
    ↓
agent_id + Agent API Key
    ↓
OTLP / Conversation upload
    ↓
Key ownership overrides payload identity
    ↓
Runtime auto-detection + canonical Agent view
```

这样，同一个 Agent 的不同 Telemetry Source 可以归到一起。身份由服务端管理，服务名只帮助识别来源。

## 借来的产品结构不合用，最后还是重写了

早期版本借用了已有可观测平台的产品结构。我以为隐藏几个菜单、改一下首页就够了，用起来才发现对象对不上：原平台围绕 Trace、Prompt、Dataset 组织页面，我需要的是 Agent、Evidence、Evolution Job 和 Candidate。

继续适配，就要维护许多用不到的入口和后端概念。后来我保留了学到的 Trace 交互方式，重写了 Go 控制面和 React 前端。Go 处理 OAuth、Agent API Key、OTLP、任务状态和租户隔离；PostgreSQL 保存业务记录，ClickHouse 保存 Span。Evolution Runner 和数据库放在私有网络。

MVP1 最后保留了 Agent、对话、记忆、Trace、Trace Farm 和 API 管理六个入口。重写有成本，但比继续适配一套不同的对象模型更容易维护。

## 分析之后，候选改动放在哪里

单条 Trace 可以用来诊断故障；要判断一个问题是否反复出现，则需要更多运行。Catena 按 Agent 和时间窗口冻结一份 Trace Set，之后的问题发现、候选生成和证据评审都使用这份输入。

-   **agent.md**：跨任务都成立的行为约束与工作方式。
-   **Skill**：可以复用到其他 Agent 的特定能力与流程。
-   **Role**：稳定的职责、边界和领域工作方法。
-   **Harness**：只在 XiaoBaOS 上生成的 Runtime 代码改动，回到隔离环境验证后应用。
-   **Case**：从失败中沉淀的固定回归输入，保护已经发现的边界。

候选都保留来源 Trace，便于检查建议是否针对原问题。采用之前，还要把候选带回本地验证。

## MVP1 还缺哪些部分

本文所述的 Catena 是 single-node Beta，还没有多 Worker lease、崩溃恢复、组织级 RBAC、配额和多节点调度。候选资产发布到 SkillHub 或 RoleHub 也需要批准。

MVP1 先验证从上传记录、分析问题到本地验收候选的流程。要支持更多用户和更长任务，队列可靠性、恢复机制和组织权限还得继续补。

Catena MVP1 已经开源，也有公开的单机 Demo。可以先看一个 Agent 的 Trace，再看分析任务如何保留候选的来源。项目源码：[github.com/fightheyyy/CATENA](https://github.com/fightheyyy/CATENA)。

[Open Live Demo →](https://118.145.231.71) [View on GitHub →](https://github.com/fightheyyy/CATENA)

---

[查看原版文章及交互图表](/classic/posts/catena-edge-cloud-evolution.html)
