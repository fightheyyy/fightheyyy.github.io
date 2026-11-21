---
title: "CATENA：Worker 已经过期，凭什么还能写回结果？"
description: "从 SKIP LOCKED、Lease、Heartbeat、Fencing Token，到 Kafka 位点、ClickHouse 重复数据和候选评测，把可靠性与持续优化逐层拷问。"
date: "2026-11-22"
author: "Fightheyyy"
category: "resume"
tags: ["项目", "Go", "PostgreSQL", "Kafka", "OpenTelemetry", "Harness"]
readingMinutes: 32
---

CATENA 最强的技术线是两种可靠性：任务执行不能被过期 Worker 污染，Trace 摄取不能因为下游故障就失去恢复能力。持续优化建立在这些事实之上；如果状态和观测都不可信，候选评测会比较错误的东西。

::callout
---
title: 从简历出发，不从术语出发
---
**简历事实**：2026.05–2026.10，Go / React 全栈；多租户控制面、OpenSandbox 执行；Session / Run 持久化、Checkpoint、Sandbox 生命周期；PostgreSQL SKIP LOCKED、Lease、Heartbeat、Fencing Token 和状态对账；OTel Collector → Kafka → ClickHouse，故障注入验证停机后积压恢复；Trace 驱动 Skill / Harness 候选，Harbor Baseline / Candidate 独立评测与人工采纳。

本文没有逐行审计 CATENA 源码。SQL、故障矩阵、身份组合及指标是复盘参考；你需要用项目真实实现和实验记录确认。简历没有给出吞吐、零丢失或自动提升百分比，不额外补造。
::

## 90 秒开场：把执行面与控制面分开讲

先讲一个任务：控制面接受请求并保存 Run，Worker 认领后在沙箱里执行，结果带执行身份回写；观测流水线异步收集 Trace；优化流程基于失败生成候选，在独立环境比较后人工决定是否采纳。

**问：Session、Run、Attempt 是同一件事吗？**

不是同一个概念。Session 组织连续上下文；Run 表达一次执行目标；Attempt 是某次尝试的身份。项目是否有单独 Attempt 表不是重点，但重试时必须区分「相同目标的新尝试」与重复结果。用你的真实模型名替换这些通用名。

## 先把旧 Worker 的时间线画对

::note-figure
---
caption: "复盘示意：租约过期后新的执行者持更高 token；写入端拒绝旧结果。下方展示 Trace 的写入与位点顺序，不承诺跨系统 exactly-once。"
label: SKETCH
---
[![CATENA 时序：Worker A token 7 暂停并过期，Worker B token 8 接手成功；数据库拒绝 A 的迟到写回。OTel 经 Kafka 到 ClickHouse，先写入再提交位点，重放需去重。](/assets/resume/catena-leases.png)](/assets/resume/catena-leases.png)
::

## 第一层：SKIP LOCKED 只解决了哪一刻

**问：两个 Worker 怎样不认领同一个 Run？**

在短事务中选择可执行行并锁定，跳过其他事务已锁的行，再更新 owner / lease / token 并提交。认领与状态更新必须处于同一原子边界；事务结束后行锁不会继续保护长时间执行。

**追问：为什么不能 SELECT 完了再 UPDATE？**

若没有锁或条件更新，中间存在竞争窗口。`SKIP LOCKED` 是避免认领互相等待的一种手段，不能替代状态条件、租户过滤、索引和更新检查。[PostgreSQL SELECT / locking clause](https://www.postgresql.org/docs/current/sql-select.html)。

**追问：会不会饿死某些任务？**

会有不公平或热点跳过的可能。要按实际调度顺序、重试时间和扫描策略解释；不要把跳过锁当成 FIFO 保证。排队延迟、租户配额及长期未执行任务需要独立观测。

**追问：为什么不整个任务都放事务里？**

沙箱可能运行几分钟，持有数据库事务会占连接、锁和版本资源。短事务认领，外部执行，短事务提交；中间靠租约和版本约束管理业务所有权。

## 第二层：Lease、Heartbeat、Fencing 各管什么

| 机制 | 解决的问题 | 单独做不到的事 |
| --- | --- | --- |
| Lease | 在有限时间内赋予执行权 | 不能强制旧进程停止 |
| Heartbeat | 在有效 owner 下续期并提供存活信号 | 不能证明任务有业务进展 |
| Fencing Token | 区分先后执行世代，拒绝旧写入 | 不能自动回滚已发生的外部副作用 |
| 对账 | 找出状态与资源的偏差并收敛 | 不能代替原子状态转移 |

**问：有 Lease 为什么还要 Fencing？**

A 拿 token 7 后长暂停；租约失效，B 拿 token 8；A 恢复并误以为自己仍有执行权。只有写入端核对当前 token / owner / 状态与租约，才能挡住 A。只让 A 自己判断时间是不够的。

**问：token 在哪一层检查？**

所有关键提交边界：续租、完成、失败和 Checkpoint 写回都要审视，不能只保护最终 success。下面是提交语义示意，不是项目表结构：

```sql
UPDATE runs
SET status = 'succeeded', result_ref = :result_ref
WHERE id = :run_id AND tenant_id = :tenant_id
  AND owner_id = :worker_id AND fencing_token = :token
  AND status = 'running' AND lease_until > CURRENT_TIMESTAMP;
-- 检查影响行数；0 行表示本次结果无权提交。
```

**问：token 用时间戳行不行？**

关键是按资源所有权单调递增，不能因机器时钟回拨、碰撞或重试复用破坏顺序。说明 token 由哪个原子操作产生，在哪个 Run / 资源域有效；不是随便生成一个 UUID 就有 fencing 的顺序语义。

**问：外部 API 不支持 token 怎么办？**

数据库拒绝旧结果不代表已发送的邮件、扣费或远端文件写入消失。需要目标系统的幂等键、版本化产物、代理校验或可补偿业务流程；无条件安全恢复并不存在。面试把保证限制在真实受保护的边界。

## 第三层：Heartbeat 活着，任务也可能卡死

**问：续租协程一直正常，但执行线程卡住呢？**

存活与进展分开。记录执行阶段、最后进度和最大运行时间，必要时取消、隔离或告警。Heartbeat 不是进展证明；停止续租会让新 Worker 接手，但旧进程还需要资源回收和写回防护。

**问：续租晚了一次，要不要继续？**

按租约规则判断。续租操作应核对旧 owner / token 和有效期，不能让过期 Worker 抢回所有权。网络暂态故障如何处理取决于租期、安全余量与重试策略；不要凭本机时钟擅自延长数据库授予的执行权。

**问：Go context 取消以后 goroutine 会退出吗？**

不会自动退出。阻塞操作需要接收 context 或用 select 观察 `Done()`；循环、Channel、HTTP、数据库与子进程各有退出路径。`defer cancel()` 释放资源，但不是杀死任意 goroutine。重点准备一次取消后 goroutine / Sandbox 不泄漏的测试。[Go context 文档](https://pkg.go.dev/context)。

**问：为什么还要对账？**

控制面已标失败但沙箱仍在跑、Run 活跃但资源已丢失、租约过期但 Worker 不再回来，这些需要从持久状态和资源实际状态收敛。对账自身也应能重复运行，并避免把新世代资源误删。

## 第四层：Checkpoint 不是一张「恢复成功」通行证

**问：恢复的是对话状态，还是整个进程？**

要说清保存内容：执行阶段、消息、工具状态、产物引用与版本；不能因为保存了消息就声称能恢复内存、网络连接或外部进程。OpenSandbox 的隔离能力、快照能力与应用层 Checkpoint 也不能混成一件事。

**问：恢复后某个工具会不会执行两次？**

Checkpoint 可能落在工具执行和结果提交之间。先查已持久化的动作身份 / 回执；不能重放有副作用工具而不做判断。恢复也需要验证代码、Skill、模型及输入版本是否兼容。

**问：多租户隔离只靠 tenant_id 吗？**

需要贯穿 API 鉴权、查询过滤、队列 / 资源配额、沙箱文件与网络、产物访问和 Trace 读取。客户端提供的 tenant_id 不是可信身份。面试可以拿「猜另一个租户的 Run ID」做负向测试，检查是否还能读取结果。

## 第五层：Trace 可靠摄取的两个崩溃窗口

先画一条最小链：应用埋点 → Collector → Kafka → 消费者 → ClickHouse。应用没有成功导出的 Span 可能连 Kafka 都没到，不能仅因 Kafka 存在就宣称全链路零丢失。[Collector resiliency](https://opentelemetry.io/docs/collector/resiliency/)。

**窗口 A：先提交位点，后写 ClickHouse。**

位点已前进但数据还没落库时崩溃，会跳过尚未持久化的数据。因此可靠消费通常先确认下游写入，再提交对应位点。

**窗口 B：先写 ClickHouse，后提交位点。**

写入成功但位点没提交时崩溃，恢复后会重放，所以要处理重复。这是 at-least-once 的常见代价。并行批处理还要按分区的连续完成区间提交，不能因为后一批成功就跳过前一批失败。[Kafka delivery semantics](https://kafka.apache.org/41/design/design/)。

**问：ClickHouse 去重能立即保证唯一吗？**

要按实际表引擎、去重配置、插入批次、查询方式和版本解释。不能只说用了 ReplacingMergeTree 就承诺所有读取立刻唯一；后台合并和查询语义有条件。准备实际 event / span 身份与重复计数方法。[ClickHouse ReplacingMergeTree](https://clickhouse.com/docs/engines/table-engines/mergetree-family/replacingmergetree)。

**问：积压恢复时怎样不压垮数据库？**

监控 lag、最老未消费事件年龄、写入失败、重试和吞吐；限速、批量与背压都需按真实数据验证。永久坏数据不能把整个分区永远堵死，但跳过也必须留可审计记录。Kafka 保留期和磁盘容量决定最长可恢复窗口。

**问：Kafka 保证全局顺序吗？**

顺序通常在分区内讨论，跨分区并不天然全序。trace_id、span_id 和事件时间用于关联，不应依赖摄取顺序还原所有父子关系。跨服务时钟偏差也会影响直观时间排序。

## 故障注入：怎样证明恢复，而不只证明重启

| 注入故障 | 要观察的状态 | 通过条件示例 |
| --- | --- | --- |
| 认领后 kill Worker | 租约、接手世代、旧结果 | 可重新认领，旧 token 写回失败 |
| 暂停 A，B 接手，再恢复 A | 两个结果的提交记录 | 仅当前 owner 能改变终态 |
| ClickHouse 停机 | Kafka lag、重试、磁盘 | 保留窗口内积压可恢复、错误有记录 |
| 落库后提交位点前崩溃 | 重放数量、重复处理 | 不漏事件，重复符合已声明策略 |
| 控制面取消时沙箱仍在运行 | Run 状态、沙箱和回调 | 迟到成功不能覆盖取消，资源最终回收 |

这些是建议的验收条件。简历只明确说做过数据库停机后的积压恢复验证，不能把整张矩阵都说成已跑完。

**必须补的实验记录**：输入事件数量及唯一 ID 集、停机时长、峰值积压、恢复耗时、重试、重复 / 缺失计数、Kafka 保留配置及数据比对方法。只看曲线回落到零不足以证明最终数据完整。

## 第六层：持续优化怎样避免「模型自己夸自己」

**问：Trace 怎样变成一个候选？**

失败记录 → 可复现的问题 / Case → 修改候选 → 固定条件下对照 → 人工决策。候选可以改变 Skill、Prompt 或 Harness，不同类型需要不同检查。分析器提出解释不代表根因已经证实，生成代码更不代表系统已改进。

**问：为什么 Baseline / Candidate 要独立？**

文件、缓存、数据库、记忆和环境都可能污染下一次运行。两者应按相同任务与约束、独立状态执行，并锁定版本。候选不能读取参考答案或 Judge 的隐藏材料，也不能靠改评分器获得提升。

**问：Harbor 是什么？**

本项目语境是 Agent 评测 / 运行环境框架，面试时要拿出确切仓库、版本与调用方式，避免与同名容器镜像仓库混淆。[Harbor 评测框架](https://harborframework.com/docs)。接入框架不等于全部评测环境已经独立，需展示实际隔离配置。

**问：分数高一点就采纳吗？**

先过确定性、安全和接口回归，再比较任务质量、成本、延迟和波动；用保留 Case 检查未针对的任务。人工采纳要保留候选版本、理由和回滚路径。单次胜出可能来自模型随机性；简历表述是人工采纳决策，不要讲成无人值守自动发布。

## 明早 30 分钟闭卷拷打

先用 8 分钟画 A / B Worker 时间线，分别证明认领、续租、Checkpoint 和终态提交谁有权。用 8 分钟画两个 Kafka 崩溃窗口，解释哪里可能漏、哪里会重复。用 7 分钟说出数据库停机实验如何核对完整性，最后 7 分钟解释一次候选如何从失败 Case 走到人工采纳。

**过关标准**：每个「可靠」后面都能补一句「在什么假设下，故障后怎样收敛，哪份记录证明」。不能回答的假设写入待办，不要升级措辞。

## 证据与复盘入口

- [CATENA 源码](https://github.com/fightheyyy/CATENA)：定位调度、结果写回、对账与消费者位点处理；历史实验要固定 commit。
- [PostgreSQL SELECT](https://www.postgresql.org/docs/current/sql-select.html) · [Kafka design](https://kafka.apache.org/41/design/design/) · [Collector resiliency](https://opentelemetry.io/docs/collector/resiliency/)。
- 待你补齐：过期结果拒绝测试、实际表结构、Checkpoint 契约、故障注入前后 ID 对账、Baseline / Candidate 的版本与独立环境配置。
