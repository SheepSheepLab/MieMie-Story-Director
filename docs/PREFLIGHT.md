# 真实酒馆人工验收 Checklist

状态：**PENDING — post-release manual smoke test / follow-up**。目标版本 **0.2.0**，功能依据是 Owner 已批准的 0.1.5。Owner 已明确授权不等待人工验收而发布；Desktop manual、Mobile manual、Real API manual 均为 PENDING，不因发布或自动测试通过而改成 PASS。记录验收日期、系统／浏览器、酒馆与酒馆助手版本、Hub版本、构建 SHA、所用预设和结果；使用测试聊天，避免把私人上下文附在公开报告。

## Desktop / Standalone

- [ ] 停用旧版后导入单脚本，刷新可正常启动。
- [ ] 浮动入口、打开窗口、顶部开关开启／关闭。
- [ ] API 保存、连接测试、模型列表及手填模型。
- [ ] 普通发送：副 API 先规划，唯一 story_scene 内文进入主 API 原玩家输入位置。
- [ ] regenerate、swipe 的既有行为；不宣称 swipe 必然调用副 API。
- [ ] 在副请求等待和主请求阶段取消，核对现有取消边界。
- [ ] 切聊天／角色后不会错误交接上一轮。
- [ ] 自建条目置顶新增、编辑、启用、删除、排序与自动保存；刷新保留。
- [ ] 三条默认固定底部，不可编辑、删除或排序；可开关、滚动查看、选择复制。
- [ ] 单条／整库导出、导入、三库隔离。
- [ ] Debug 五种内容、selector、清除、日志滚动、页面切换保留数据及隐私提示。
- [ ] 返回／重新打开，不新增业务实例，已存配置与原有数据正确。

## Hub

- [ ] 本地直接导入后的注册，和发布后 Hub Package 安装分别验收。
- [ ] 实际 release tag、附件大小、GitHub SHA digest 与 metadata 两层 hash 正确。
- [ ] honeycomb 启动、Surface 打开／关闭。
- [ ] Shortcut 启用／关闭、拖拽与入口显示。
- [ ] 扩展 enable／disable，Hub reload 不重复注册或生成。
- [ ] Standalone → Hub 交接及当前窗口状态。
- [ ] Hub → fallback，保持一个 Director 实例。
- [ ] 实际服务器保存后重载仍有安装实例；不是只验证内存脚本树。
- [ ] 如需与 Polisher 同用，单独检查实际请求组合与 D-003 边界。

## Mobile / 实体设备

- [ ] launcher、panel 边界、屏幕旋转及窄屏布局。
- [ ] sidebar 四页和当前项高亮。
- [ ] 编辑器打开／完成、输入法键盘、textarea 手动尺寸与滚动。
- [ ] popover 边界、再次点击收起、动作可触达。
- [ ] touch drag 排序与仅被拖动条目的果冻反馈。
- [ ] safe area、右侧停靠入口与工具按钮不互相遮挡。
- [ ] 真实 normal generation、regenerate、cancel。
- [ ] 回到页面／刷新后配置、库和密钥偏好符合用户选择。

## 迁移与隐私

- [ ] 已备份，旧 0.1.22 停用，新旧不同时启用。
- [ ] 已有 DIY 名称、内容、启用状态与顺序、API 配置保留；旧默认按 MIGRATION.md 迁移，不覆盖玩家改动。
- [ ] 历史记住 Key 正常恢复；未记住 Key 重新填写；清除可用。
- [ ] 分享的 Debug 不含私人聊天或实际密钥，正式包 data 为空。

任何失败记录具体条件与范围，区分原有 Deferred 行为和新回归。Business/Core 修复必须另经 Owner 确认，不能在人工验收时自行更改冻结基线。
