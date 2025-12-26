# Claude-Mem 迁移指南

## 🚀 迁移到 chengjon/mem-claude

### 变更概述

为了更好地管理和分发，Claude-Mem 已经迁移到新的仓库地址：

**旧安装方式**：
```bash
/plugin marketplace add chengjon/mem-claude
```

**新安装方式**：
```bash
/plugin marketplace add chengjon/mem-claude
```

### 📍 安装路径变更

- **旧路径**: `~/.claude/plugins/marketplaces/chengjon/`
- **新路径**: `~/.claude/plugins/marketplaces/chengjon/`

### 🔄 迁移步骤

#### 1. 卸载旧版本
在Claude Code中运行：
```bash
/plugin uninstall mem-claude
```

#### 2. 安装新版本
```bash
/plugin marketplace add chengjon/mem-claude
/plugin install mem-claude
```

#### 3. 重启Claude Code
重启Claude Code以确保新插件正常工作。

### 📊 数据保留

**好消息**: 您的所有对话数据都安全保存在：
- 数据库: `~/.mem-claude/mem-claude.db`
- 设置: `~/.mem-claude/settings.json`
- 日志: `~/.mem-claude/logs/`

这些数据路径保持不变，不受插件位置变更影响。

### 🛠️ 手动迁移（可选）

如果您想要手动迁移旧插件目录：

```bash
# 备份旧插件
cp -r ~/.claude/plugins/marketplaces/chengjon ~/.claude/plugins/marketplaces/chengjon-backup

# 卸载旧插件
/plugin uninstall mem-claude

# 安装新插件
/plugin marketplace add chengjon/mem-claude
/plugin install mem-claude
```

### 🔧 常见问题

#### Q: 迁移后看不到旧对话记录？
A: 检查数据目录是否存在：`ls ~/.mem-claude/`
如果数据丢失，可以从备份恢复：
```bash
cp ~/.claude/plugins/marketplaces/chengjon-backup/plugin/.install-version ~/.mem-claude/
```

#### Q: 插件安装失败？
A: 确保使用正确的安装命令：
```bash
/plugin marketplace add chengjon/mem-claude
```

#### Q: 需要同时保留新旧版本吗？
A: 不建议。新版本功能更完整，建议完全迁移到新版本。

### 📞 获取帮助

如果您在迁移过程中遇到问题：
1. 检查Claude Code日志
2. 确认数据目录完整
3. 提交GitHub Issue: https://github.com/chengjon/mem-claude/issues

### ✨ 新版本特性

新版本包含以下增强功能：
- 🏷️ **关键词过滤**: 支持AND/OR逻辑的关键词搜索
- 🤖 **AI集成工具**: 完整的外部AI系统集成方案
- 📊 **对话分类**: 区分用户对话和AI回复
- 🔧 **工具跟踪**: 完整的工具执行历史记录
- 📚 **增强文档**: 完整的API和集成指南

---

**注意**: 迁移完成后，请使用新的仓库地址获取更新和支持。

新仓库: https://github.com/chengjon/mem-claude
