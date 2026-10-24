---
title: "两个月用掉 130 亿 Token 后，我总结出 3 个 Codex 开发 Skill"
description: "高频使用之后，我把自己的开发流程整理成了三个 Skill：SuperDev 讨论架构，SuperGoal 拆分任务，SuperReview 审查和修复。这里记录各自怎么用，以及哪些决定还得自己做。"
date: "2026-07-16"
author: "Fightheyyy"
category: "Skills"
tags: ["Agent Engineering","SuperCoding"]
featured: false
draft: false
readingMinutes: 10
---

过去两个月，我在 Codex 里累计用了 13B Token，单次峰值 1.1B，最长任务跑了 12 小时 26 分。用得多了，一个问题越来越明显：Agent 可以很快改出一大批代码，我却没有同样多的时间把每个改动都看明白。

::note-figure
---
caption: "截至 2026 年 7 月的 Codex 使用记录：累计 13B Token，单次峰值 1.1B，最长任务 12 小时 26 分，当前与最长连续使用均为 24 天。点击查看原图。"
label: FIG.
---
[![Codex 使用记录截图，显示累计 13B Token、峰值 1.1B Token、最长任务 12 小时 26 分，以及连续使用 24 天](/classic/assets/posts/supercoding/codex-token-activity.png)](/classic/assets/posts/supercoding/codex-token-activity.png)
::

这些使用量说明不了代码质量。更值得写的是我后来固定下来的三个步骤：先讨论架构，再拆任务，最后审查和修复。我把它们整理成了 SuperDev、SuperGoal 和 SuperReview。

## 只等着最后看 diff，太晚了

等到 Agent 改完再看 diff，很多问题已经跨了几个模块。某个接口为什么变了、状态为什么挪到另一层，常常要重新追一遍。我的做法是先约定范围，让实现过程中就有东西可对照。

开工前，我会先和 Agent 对齐四件事：

**逻辑架构**系统当前怎样工作，目标状态怎样工作。

**边界**哪些模块、接口、数据和非目标不能被随意改变。

**验收指标**什么可观察结果出现后，任务才允许停止。

**证据**测试、产物、运行状态和最终 diff 怎样证明结果成立。

局部实现可以让 Agent 自己选择。涉及模块边界或验收条件的变化，则需要回到这些约定里重新看。

## SuperDev：开发前先把架构聊清楚

SuperDev 要求开发前先读现有实现，说明准备改哪部分、改完之后怎样工作。架构讨论结束，再开始修改。

我用 Mermaid 画当前和目标架构。比起几段说明，图更容易让我看出谁调用谁、数据经过哪里。图当然也会画错，所以“当前架构”必须对照代码检查。

### SPEC.md

**当前逻辑架构**记录系统真实怎样运行。

**目标逻辑架构**记录这次变化准备把系统带到哪里。

### PLAN.md

**做了什么**记录完成状态、下一步、风险和验证证据。

还差哪些步骤、哪些检查没过，也写在这里。

```text
Current Architecture
        ↓ identify the gap
Target Architecture
        ↓ execution evidence
PLAN.md: status / risks / verification
```

这样重新打开任务时，读 SPEC.md 可以知道准备怎么改，读 PLAN.md 可以知道做到了哪里。文档需要跟着实现更新，否则很快就会失去用处。

## SuperGoal：把目标架构拆成可并行的工作

SuperGoal 把已经确定的目标拆成子任务，给每项写明完成条件和允许修改的文件。依赖允许、写入范围又不冲突的部分，可以交给多个 subagent 同时做。

**Main Agent**定义验收、拆分边界、决定合并、最终验证

Discovery Implementation A Implementation B Verification

**Integrate**接受、拒绝或收窄每个结果

拆不开的任务就顺序做。两个 subagent 同时改同一组核心文件，容易互相覆盖，也要花时间重新理解对方的改动。只读调研、独立模块和单独的验证工作更适合并行。

主 Agent 负责处理依赖、整合结果和最终验收。每个 subagent 只接一项范围明确的工作，返回改动与验证结果。合在一起是否仍然正确，需要主 Agent 再检查。

## SuperReview：查出问题，修完再看一遍

SuperReview 开始时先确定要审查哪个 PR 或哪一份 working tree。主 Agent 读完整 diff 和相关代码，判断问题是否成立、是否属于本次范围，再安排修复。

确认的问题可以分别交给 repair subagent。每个只修一项，带回补丁和验证结果；会改到同一模块的问题则顺序处理。

主 Agent 完整审查 **→** 冻结 findings **→** 原子修复 **→** 主 Agent 验收补丁 **→** 重审最终 diff

补丁合入后，要重新读最终 diff，检查修复有没有引入新问题。审查中发现的问题都处理完，才结束这轮工作。这只能覆盖本次审查发现的问题，无法保证软件没有其他 bug。

## 为什么是瞄准环、构建体和扫描框

页面顶部的三个装置分别对应这三个 Skill。可以拖动或点击，看看各自的动作。

**瞄准环**

### SuperGoal

瞄准环对应确定目标和完成条件。

**构建体**

### SuperDev

构建体对应检查模块关系和组织实现。

**扫描框**

### SuperReview

扫描框对应审查 diff 和验证修复。

使用时也会往回走：通常先用 SuperDev 讨论架构，再用 SuperGoal 拆任务；如果 SuperReview 发现问题出在结构上，就回头修改设计。

## 哪些决定仍然要自己做

### 人

决定真正想解决的问题，选择架构取舍，定义不能接受的风险。

### 主 Agent

维护控制面，拆分任务，判断 findings，整合结果，执行最终验收。

### subagent

在明确边界内探索、实现或修复，并返回可复核的证据。

### 工具与测试

提供系统实际发生了什么的硬证据，不让模型用语气代替完成。

关键代码仍然要自己看，架构取舍和能接受的风险也得自己决定。这套流程能帮我整理工作，但如果验收条件本身写错了，Agent 把每一步都执行完也没用。

这三个 Skill 放在同一个 SuperCoding 仓库里。我会继续根据实际使用修改它们，尤其是任务拆多细、哪些改动需要停下来重新讨论。

[View SuperCoding on GitHub →](https://github.com/fightheyyy/SuperCoding)

---

[查看原版文章及交互图表](/classic/posts/supercoding-agent-engineering.html)
