# 当前范围与后续检查

> 版本范围：下文为原 0.2.0／早期阶段的完整记录，原人工 Pending 与授权仅对当时版本有效；本 API2 开发候选的当前验收见 [TESTING](TESTING.md#api2-pre-main2026-10-20)，并未获得正式发行或生产授权。

当前为 0.2.0，功能与 UI 保持已批准的 0.1.5。真实酒馆 Desktop／Mobile／Real API 状态均为 **PENDING — post-release manual smoke test / follow-up**；Owner 已授权先发布，不声称人工验收通过。

- 当前适配咩咩预设故事模式；功能基线为 5.8.2 所用结构。群聊、其他预设、续写／静默／代替用户生成不在当前导演规划范围。
- 主接口要求酒馆 OpenAI 聊天补全模式。副接口需要兼容协议，浏览器跨域和服务商行为仍要实际确认。
- 只有唯一完整 story_scene 内文交给主 API。标签缺失、重复、嵌套或空大纲会拒绝交接；不自动猜测其他格式。
- 已确认的业务边界保持原版，包括响应头后的取消窗口、READY 到 dispatch 的编辑窗口、其他改写原始请求的脚本与精确 body 匹配的组合边界。工程证据和后续范围见 `DEFERRED.md`，本阶段不修复。
- 自动协议／DOM／Chromium测试不等同于真实酒馆保存、服务商调用、完整 Hub + Polisher 组合验收或实体手机键盘与安全区体验。
- Debug 可能包含完整聊天内容，分享前自行检查。记住的密钥位于 localStorage，并非加密保存。
- 正式附件以 [0.2.0 Release](https://github.com/SheepSheepLab/MieMie-Story-Director/releases/tag/v0.2.0) 为准，必须通过真实 GitHub digest 与 Package v1 校验。尚未投稿 Hub Catalog。
