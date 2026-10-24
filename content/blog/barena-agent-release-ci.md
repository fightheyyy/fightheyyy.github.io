---
title: "Barena：改完 Agent，怎样判断这一版能不能发"
description: "把新旧配置放进同一组任务，检查产物，再看提升是否稳定。一轮 144 次运行的实验，让我重新收紧了哪些数据可以用来比较。"
date: "2026-07-17"
author: "Fightheyyy"
category: "Evals"
tags: ["Agentic Eval","Release Engineering"]
featured: false
draft: false
readingMinutes: 11
---

改了一段 Prompt，换了模型，或者给 Agent 加了一个 Skill，这一版能不能发？这是我做 Barena 时想解决的问题。手动试几次可以发现明显错误，但很难判断它比上一版好在哪里，又有没有把原来能做的事弄坏。

因此每次评测都要带上旧版本。下文把旧配置叫 baseline，新配置叫 candidate：两边跑同一组任务，再比较成功率、失败原因和结果是否稳定。

## 几行 diff，为什么单元测试兜不住

给 Skill 增加一段说明、替换模型、开放一个新工具，代码 diff 可能只有几行，行为变化却会穿过整个系统。模型会不会选择这个 Skill，工具是否写进正确目录，环境里有没有残留状态，外部服务失败后 Agent 会不会换一条路径——这些问题无法只从实现中推出答案。

单元测试可以检查参数转换、文件读写等确定性逻辑。模型会选哪个工具、失败后会不会重试，则需要把 Agent 放进任务里实际运行。两部分都要测。

::note-figure
---
caption: "图 1：Barena 先验证实验是否成立，再讨论提升。行为证据与结果证据缺少任何一路，结论都会降级，而不是由另一路代填。"
label: FIG.
---
[![Barena 架构：一次 Agent 变更进入成对实验，在隔离环境中执行；OTel Trace 与 Reviewer 形成行为证据，Artifact Verifier 与边界观察形成结果证据，最后进入 cleared、held、rejected 发布门。](/classic/assets/posts/barena/architecture.png)](/classic/assets/posts/barena/architecture.png)
::

## 为什么还要和上一版比较

| 机制 | 核心问题 | 典型输出 |
| --- | --- | --- |
| Benchmark | 谁在一组公共任务上表现更好？ | 分数、排名、能力比较 |
| Eval | 一个 Agent 在目标任务上表现怎样？ | 通过率、错误类型、轨迹 |
| Release CI | 这次具体变更是否有效、稳定、无回归，可以发布吗？ | `cleared`、`held`、`rejected` |

公共任务上的分数有参考价值，但不直接回答某次改动值不值得采用。一个 Skill 得分很高，当前 Agent 可能本来就会做这些任务；一个模型平均分更高，也可能在重要的旧任务上更不稳定。

## 尽量只改一个变量

要判断改动有没有用，先尽量固定其他条件。同一个任务分别交给 baseline 和 candidate，比较两边的结果。即便这样，模型和环境的波动仍然会影响判断。

```text
Barena(
  target runtime,
  baseline configuration,
  candidate configuration,
  E2E case pack,
  replay policy
)
  → effectiveness
  → stability
  → regressions
  → evidence
  → cleared | held | rejected
```

评测 Skill 时，两边使用同一个 Agent，一边不加载，另一边加载候选 Skill。评测其他改动时，也尽量固定任务、Runtime、模型、工具和验证器，只改变待评估的那一项。

## 两边都满分，也可能看不出改进

假设两边通过率都是 100%，这组任务就没有显示出 candidate 的增益。在 Barena 当前这套规则下，结果会标成 `no_effect`，发布状态为 `held`。这不表示改动毫无价值，只表示这次评测没有测到提升。

如果总通过率提高，但关键 Case 从稳定通过变成偶发失败，也需要单独处理。平均分会把这类退化藏起来，所以发布判断还要检查每个 Case。

```text
same task + same runtime + fresh workspace
                 │
         ┌───────┴────────┐
         │                │
     baseline         candidate
         │                │
    attempts × N      attempts × N
         └───────┬────────┘
                 ↓
 verifier-backed lift + regressions + stability
```

## Agent 说“完成了”，不能算完成

比如 Agent 回答“文件已经生成”，但磁盘上没有目标文件。再找一个模型读它的回答，仍然可能漏掉这个问题。文件任务需要直接检查文件。

Barena 把证据拆成三层：最终回答记录 Agent 的声明；Trace 解释它走了什么路径；Artifact Verifier 直接检查文件、JSON 结构、内容和其他可观察状态。发布结果以 Verifier 为准，Reviewer 主要帮助解释失败模式。

| 证据层 | 回答什么 | 不能单独证明什么 |
| --- | --- | --- |
| Agent final answer | Agent 声称自己做了什么 | 真实产物已经存在 |
| Trace / Reviewer | 过程如何发生、哪里可疑 | 最终状态一定正确 |
| Artifact Verifier | 可观察结果是否满足断言 | 隐藏推理一定合理 |

## 没有观察到的过程，就留空

每次尝试会保存任务输入、进程状态、工作区变化、Runtime 原生轨迹和 Verifier 结果。原生 Trace 可以通过 OpenTelemetry 的 OTLP 协议导出；Barena 从进程和文件系统观察到的结果则另记为 boundary evidence，标明来源。

只观察到进程输入、输出和文件变化，就无法还原内部工具调用顺序。缺了原生 Trace，这部分就留空；没有 Verifier 结果，也不能拿 Reviewer 的评价当作验证通过。

```text
User task
   ↓
fresh baseline / candidate attempts
   ↓
boundary evidence + OTel trace + artifacts
   ↓
Reviewer signal + deterministic Verifier
   ↓
validated evidence package
   ↓
paired release gate
```

## 多跑几次，看结果会不会变

只跑一次，很难分清稳定通过和碰巧成功。实际使用中，如果同样的任务经常需要重试，一次绿色结果就没什么说服力。

Barena 会为同一个配置运行多次独立 attempt。候选即使有提升，结果仍然不稳定时也会被 `held`，留待继续检查。

## 证据不够时，暂缓发布

工具没启动、Verifier 没运行、配对的一边没有结果，都可能让比较无法进行。Barena 用三种状态表达发布判断：

-   **`cleared`**：候选产生稳定、Verifier 支持的正向提升，没有测得回归。
-   **`held`**：结果不稳定、没有效果、证据不全，或当前不具备比较资格。
-   **`rejected`**：出现能力回归或不安全行为。

`held` 表示现在还不能做发布决定。需要继续区分是候选表现不稳定，还是运行条件、证据收集出了问题，不能一律算成 Agent 做错了。

## 一个真实案例：144 次运行之后，能比较的只剩 36 对

我用 SkillsBench v1.1 做了一轮验证：从 8 个类别各选 3 个公开任务，用同一个 XiaoBaOS Agent 比较“不加载任务 Skill”和“加载任务 Skill”。每边独立运行 3 次，共 24 × 2 × 3 = 144 次 rollout。

成功与否由 SkillsBench 的确定性 Verifier 判断。问题出在数据收齐之后：并非每次运行都有足够证据进入比较。

::note-figure
---
caption: "图 2：Barena × SkillsBench v1.1 方法验证。查看完整报告、数据口径与限制。"
label: FIG.
---
[![Barena SkillsBench v1.1 方法验证海报：24 个任务、144 次运行、90 个通过证据准入的结果、36 个严格匹配 pair，candidate 相对 baseline 的观察差值为正 16.7 个百分点。](/classic/assets/posts/barena/skillsbench-validation.png)](/classic/assets/posts/barena/skillsbench-validation.png)
::

Terminal rollouts **144 / 144**

所有计划运行都到达终态，但终态不等于证据有效。

Verifier-admitted **90 / 144**

只有能够证明 Verifier 实际执行的结果才进入证据池。

Strict matched pairs **36 pairs**

同一任务、同一 trial、两边证据都有效，共覆盖 14 个任务。

Complete-task gate **2 / 7 / 0**

9 个完整任务中：2 cleared、7 held、0 rejected。

Matched-pair direction **38.9% → 55.6%（+16.7 pp）**

方向为正，但 exact McNemar p = 0.109；它是描述性结果，不足以证明总体显著更强。

144 次运行里只有 90 次通过证据准入；其中 72 次组成了 36 个严格匹配 pair，另外 18 次因为另一边缺少有效对应项，不能进入配对比较。剩下 54 次属于无效或没有评分的结果。

在 36 个匹配 pair 中，baseline 通过 14 次，candidate 通过 20 次；candidate-only pass 有 8 次，baseline-only pass 有 2 次。方向是正的，但 exact McNemar `p = 0.109`，再加上缺失可能不是随机发生，所以这次实验**不能证明 candidate 在总体上显著更强**。

::callout
---
title: "SkillsBench 实验真正验证了什么"
---
144 次运行，不能直接放进同一个分母。

运行结束后，还要检查 Verifier 是否执行、两边是否有有效配对。按完整任务判断发布时，9 个任务中有 2 个 cleared、7 个 held，没有 rejected。
::

## 这轮实验后补上的规则

做完这轮实验，我把数据准入规则收紧了：

-   “进程结束”不等于“结果有效”，Verifier 是否真正执行必须有独立证据。
-   baseline 和 candidate 必须按 task 与 trial 严格配对，不能直接相减两个不同分母的总体通过率。
-   证据不完整的任务保留在审计索引里，但不能参与效果结论。
-   公开报告必须同时给出选择、准入规则、排除项和机器可读结果，不能只放一张漂亮图。

这些检查过了，才开始解释 baseline 和 candidate 的差值。否则算出的通过率可能只反映两边跑成了不同的任务。

## 日常使用的三个入口

Barena 提供三个入口：`explore` 用 UserCat 模拟用户，寻找测试集没覆盖的问题；`replay` 重跑固定 Case；`compare` 对比 baseline 和 candidate 的有效结果，给出发布判断。

Explore 发现的问题可以保存成 Replay Case。两者通过 Runtime Adapter 执行 Agent，留下 Trace、Artifact 与 Verifier 结果，供后续比较使用。

## 目前做到哪里

-   当前深度适配的 Explore Runtime 是 XiaoBaOS；Claude Code、Codex 和 OpenClaw 的多轮 Explore Adapter 仍待完成。
-   当前 `compare` 主要复用已经验证的 Skill baseline / candidate 引擎，最终的任意 RunSet 对比还在后续版本。
-   SkillsBench 实验早于现在的 OTLP Explore 路径，因此它验证的是配对准入、Verifier 和门禁方法，不是新 OTLP 模块的实验成绩。
-   公开仓库保留结果、选择和可移植证据索引；原始 provider trajectory 没有全部公开。
-   有限次 Replay 能暴露一部分 flakiness，但不能证明概率意义上的绝对稳定。

下一步还要补齐其他 Runtime 的 Explore Adapter 和任意 RunSet 对比。已经公开的 SkillsBench 报告里保留了准入规则和排除项，可以据此检查上面这些数字是怎样算出来的。

[View Barena on GitHub →](https://github.com/fightheyyy/barena)

---

[查看原版文章及交互图表](/classic/posts/barena-agent-release-ci.html)
