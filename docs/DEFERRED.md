# Deferred / Post-release Follow-up

状态：**DEFERRED / POST-RELEASE FOLLOW-UP**。0.2.0 Final RC 以已批准的 0.1.5 实现为最新功能基线，下列行为从原始 0.1.22 沿用至今。Owner 明确要求本轮不修复、不扩展业务范围；发现明确 Release Blocker 时先报告 Owner。

| ID | 当前行为与证据 | 本阶段处理 |
| --- | --- | --- |
| D-001 | 主 API fetch 返回响应头后，移除原请求 abort 监听并清空 run。内存模拟中此后取消宿主信号，不会取消已转交主 API 的信号。 | 作为冻结的现状建立回归用例，不延长请求生命周期。 |
| D-002 | 指纹在 dispatch 才记录。READY 后、dispatch 前编辑历史消息，旧准备请求仍可能进入导演。 | 作为冻结的现状建立回归用例，不补前置指纹。 |
| D-003 | Director 与 Polisher 都匹配原始请求 body；上游 body 被改写时，当前 Director 精确匹配可能失败。 | 保留当前匹配语义；不修改 Polisher，也不声称已完成实际双脚本兼容验收。 |

自动用例验证 D-001、D-002 的已知现状，D-003 的精确 body 匹配边界。D-003 用的是模拟的上游改写，不是运行 Polisher 完整产物的组合测试。

本文件记录工程事实与后续范围，不重新决定主／副 API 提示词或业务设计。以后若要修复，先取得 Owner 对具体范围的确认，不更新冻结参考以使新实现“自动正确”。
