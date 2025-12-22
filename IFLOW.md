# Claude-Mem 项目概览

## 项目简介

**Claude-Mem** 是一个专为 Claude Code 设计的持久化内存压缩系统，通过自动捕获工具使用观察结果、生成语义摘要并使它们在未来的会话中可用，从而实现跨会话的上下文保持。这使得 Claude 能够在会话结束或重新连接后保持对项目知识的连续性。

### 核心特性

- 🧠 **持久化内存** - 上下文跨会话生存
- 📊 **渐进式披露** - 分层内存检索，带令牌成本可见性
- 🔍 **基于技能的搜索** - 使用 mem-search 技能查询项目历史
- 🖥️ **Web查看器UI** - http://localhost:37777 的实时内存流
- 💻 **Claude桌面技能** - 从Claude桌面对话中搜索内存
- 🔒 **隐私控制** - 使用 `<private>` 标签将敏感内容排除在存储之外
- ⚙️ **上下文配置** - 精细控制注入上下文的类型
- 🤖 **自动操作** - 无需手动干预
- 🔗 **引用** - 通过ID引用过去的观察结果
- 🧪 **Beta通道** - 通过版本切换尝试实验性功能如无尽模式

## 技术架构

### 核心组件

1. **5个生命周期钩子**
   - SessionStart → UserPromptSubmit → PostToolUse → Stop → SessionEnd
   - 6个钩子脚本（包含预钩子smart-install）

2. **Worker服务**
   - HTTP API运行在端口37777
   - 带有web查看器UI和10个搜索端点
   - 由Bun管理

3. **SQLite数据库**
   - 存储会话、观察结果、摘要
   - 带有FTS5全文搜索

4. **mem-search技能**
   - 自然语言查询与渐进式披露
   - 自动调用当用户询问过去工作时

5. **Chroma向量数据库**
   - 混合语义+关键词搜索
   - 智能上下文检索

### 数据流程

```
会话开始 → 注入最近观察结果作为上下文
     ↓
用户提示 → 创建会话，保存用户提示
     ↓
工具执行 → 捕获观察结果（读取、写入等）
     ↓
Worker进程 → 通过Claude代理SDK提取学习内容
     ↓
会话结束 → 生成摘要，为下次会话准备
```

## 文件结构分析

### 源代码组织 (`src/`)

```
src/
├── bin/                    # CLI工具和脚本
├── cli/                    # 命令行接口
├── constants/              # 常量定义
├── hooks/                  # 核心钩子系统
│   ├── context-hook.ts     # SessionStart钩子
│   ├── user-message-hook.ts # 用户消息处理
│   ├── summary-hook.ts     # 会话总结生成
│   ├── save-hook.ts        # PostToolUse钩子
│   ├── new-hook.ts         # UserPromptSubmit钩子
│   ├── cleanup-hook.ts     # SessionEnd清理
│   └── shared/             # 共享钩子工具
├── sdk/                    # Claude代理SDK集成
├── servers/                # MCP服务器
├── services/               # 核心服务
│   ├── context-generator.ts # 上下文生成器
│   ├── worker-service.ts   # Worker服务主文件
│   ├── worker-wrapper.ts   # Worker包装器
│   ├── worker-types.ts     # Worker类型定义
│   ├── sqlite/             # SQLite数据库层
│   ├── sync/               # Chroma向量同步
│   ├── process/            # 进程管理
│   └── worker/             # Worker内部服务
├── shared/                 # 共享工具和类型
├── types/                  # TypeScript类型定义
├── ui/                     # 前端界面资源
└── utils/                  # 工具函数
```

### 插件构建 (`plugin/`)

```
plugin/
├── hooks/hooks.json        # 钩子配置定义
├── scripts/                # 构建后的钩子脚本
├── skills/                 # mem-search技能
├── ui/                     # 构建后的前端资源
└── .claude-plugin/
    └── plugin.json         # 插件元数据
```

### 构建系统

- **TypeScript** → ESM转换，使用esbuild
- **测试框架**: Vitest
- **构建命令**: `npm run build-and-sync`

## 关键功能模块

### 1. 钩子系统

**7个钩子脚本**（在`plugin/scripts/`中）：

1. **smart-install.js** - 依赖检查器（预钩子）
2. **context-hook.js** - SessionStart上下文注入
3. **user-message-hook.js** - 用户消息处理
4. **new-hook.js** - UserPromptSubmit处理
5. **save-hook.js** - PostToolUse观察捕获
6. **summary-hook.js** - Stop时生成摘要
7. **cleanup-hook.js** - SessionEnd清理

### 2. Worker服务架构

**主服务** (`src/services/worker-service.ts`):
- Express API服务器
- MCP客户端集成
- 路由域组织在`http/routes/*.ts`

**核心服务模块** (`src/services/worker/`):
- `DatabaseManager.ts` - 数据库操作
- `SessionManager.ts` - 会话管理
- `SearchManager.ts` - 搜索功能
- `SettingsManager.ts` - 配置管理
- `SSEBroadcaster.ts` - 实时广播
- `SDKAgent.ts` - AI代理集成

### 3. 数据库设计

**SQLite模式** (`src/services/sqlite/`):
- **sessions表** - 会话记录
- **observations表** - 观察结果
- **summaries表** - 会话摘要
- **FTS5虚拟表** - 全文搜索索引

**向量搜索** (`src/services/sync/ChromaSync.ts`):
- 语义搜索支持
- 混合搜索（关键词+语义）

### 4. 前端界面

**React组件** (`src/ui/viewer/`):
- 实时内存流显示
- 搜索界面
- 设置管理
- 构建到`plugin/ui/viewer.html`

## 配置系统

### 环境配置

**设置文件**: `~/.claude-mem/settings.json`

**核心配置项**:
- `CLAUDE_MEM_MODEL` - AI模型 (默认: claude-sonnet-4-5)
- `CLAUDE_MEM_WORKER_PORT` - Worker端口 (默认: 37777)
- `CLAUDE_MEM_WORKER_HOST` - Worker地址 (默认: 127.0.0.1)
- `CLAUDE_MEM_DATA_DIR` - 数据目录 (默认: ~/.claude-mem)
- `CLAUDE_MEM_CONTEXT_OBSERVATIONS` - 注入观察数量 (默认: 50)

### 隐私标签系统

**双标签系统**:
- `<private>content</private>` - 用户隐私控制
- `<claude-mem-context>content</claude-mem-context>` - 系统级标签

**实现位置**: `src/utils/tag-stripping.ts`

## 搜索功能

### mem-search技能

**10种搜索操作**:
1. 观察结果搜索 - 全文搜索观察结果
2. 会话搜索 - 全文搜索会话摘要
3. 提示搜索 - 搜索原始用户请求
4. 按概念搜索 - 按概念标签查找
5. 按文件搜索 - 查找引用特定文件的观察
6. 按类型搜索 - 按类型查找（决策、修复、功能等）
7. 最近上下文 - 获取项目的最近会话上下文
8. 时间线 - 获取特定时间点周围的统一时间线上下文
9. 按查询时间线 - 搜索观察并获取最佳匹配周围的时间线上下文
10. API帮助 - 获取搜索API文档

### 自然语言查询示例

```
"上次会话我们修复了什么bug？"
"我们是如何实现认证的？"
"对worker-service.ts做了什么更改？"
"显示这个项目的最近工作"
"当我们添加查看器UI时发生了什么？"
```

## 构建和部署

### 开发环境设置

```bash
# 克隆和构建
git clone https://github.com/chengjon/mem-claude.git
cd claude-mem
npm install
npm run build

# 运行测试
npm test

# 启动worker
npm run worker:start

# 查看日志
npm run worker:logs
```

### 生产部署

**主要构建命令**:
```bash
npm run build-and-sync        # 构建，同步到市场，重启worker
```

**文件位置**:
- **源码**: `<项目根>/src/`
- **构建插件**: `<项目根>/plugin/`
- **安装插件**: `~/.claude/plugins/marketplaces/chengjon/`
- **数据库**: `~/.claude-mem/claude-mem.db`
- **Chroma**: `~/.claude-mem/chroma/`

### 系统要求

- **Node.js**: 18.0.0或更高版本
- **Claude Code**: 最新版本，支持插件
- **Bun**: JavaScript运行时和进程管理器（缺失时自动安装）
- **uv**: Python包管理器，用于向量搜索（缺失时自动安装）
- **SQLite 3**: 用于持久化存储（已打包）

## API端点

Worker服务在 `http://localhost:37777` 提供以下端点:

### 查看器UI
- `GET /` - Web界面
- `GET /api/stream` - SSE实时流

### 上下文管理
- `GET /api/context/inject?project={name}` - 注入上下文
- `GET /api/context/observations` - 获取观察结果
- `GET /api/context/sessions` - 获取会话

### 搜索端点
- `GET /api/search/observations` - 搜索观察结果
- `GET /api/search/sessions` - 搜索会话
- `GET /api/search/concepts` - 按概念搜索
- `GET /api/search/timeline` - 时间线搜索

### 设置管理
- `GET /api/settings` - 获取设置
- `POST /api/settings` - 更新设置

## 测试框架

**测试配置** (`vitest.config.ts`):
- 使用Vitest测试框架
- 包含全局测试配置
- 排除node_modules和dist目录
- 排除node:test格式文件

**测试命令**:
- `npm test` - 运行所有测试
- `npm run test:parser` - 测试解析器
- `npm run test:context` - 测试上下文钩子

## 持续集成

### GitHub Actions工作流 (`.github/workflows/`)

- **claude.yml** - 主CI/CD流程
- **claude-code-review.yml** - 代码审查自动化
- **convert-feature-requests.yml** - 功能请求转换
- **summary.yml** - 自动生成摘要

### 发布流程

- **自动版本生成** - changelog自动生成
- **Discord通知** - 发布公告自动发送到Discord
- **市场同步** - 自动同步到Claude Code市场

## 高级特性

### Beta通道功能

**无尽模式** (实验性):
- 生物启发的记忆架构
- 大幅扩展会话长度
- 压缩工具输出为~500令牌观察
- 实时转换转录本

**版本通道切换**:
- 在Web界面中在稳定版和beta版之间切换
- 保留内存数据
- 自动重启worker

### mem-search技能集成

**智能自动调用**:
- 自然语言查询自动触发
- 100%有效性率的技能调用
- 渐进式披露策略
- 令牌计数帮助智能决策

## 故障排除

### 常见问题

1. **Worker未启动** → `claude-mem restart`
2. **无上下文显示** → `npm run test:context`
3. **数据库问题** → `sqlite3 ~/.claude-mem/claude-mem.db "PRAGMA integrity_check;"`
4. **搜索不工作** → 检查FTS5表是否存在

### 诊断工具

**自动Bug报告生成器**:
```bash
npm run bug-report
```

**功能**:
- 🌎 自动翻译 - 使用任何语言书写，自动翻译为英语
- 📊 收集诊断信息 - 收集版本、平台信息、worker状态、日志和配置
- 📝 交互式提示 - 引导用户描述问题，支持多行输入
- 🤖 AI格式化 - 使用Claude代理SDK生成专业的GitHub问题
- 🔒 隐私安全 - 自动清理路径，可选的`--no-logs`标志
- 🌐 自动提交 - 打开GitHub，预填充标题和正文

## 许可证

**AGPL-3.0** - GNU Affero通用公共许可证v3.0

- 可自由使用、修改和分发
- 如果修改并在网络服务器上部署，必须提供源代码
- 衍生作品也必须在AGPL-3.0下许可
- 软件不提供任何保证

## 贡献指南

1. Fork仓库
2. 创建功能分支
3. 用测试进行更改
4. 更新文档
5. 提交Pull Request

参见[开发指南](https://docs.claude-mem.ai/development)获取详细的工作流程。

## 支持

- **文档**: [docs/](docs/)
- **问题**: [GitHub Issues](https://github.com/chengjon/mem-claude/issues)
- **仓库**: [github.com/chengjon/mem-claude](https://github.com/chengjon/mem-claude)
- **作者**: Alex Newman [@chengjon](https://github.com/chengjon)

---

*最后更新: 2025年12月22日*  
*版本: 7.4.5*  
*技术栈: TypeScript, Node.js, Express, SQLite, React, Claude Agent SDK*  
*架构: 钩子系统, Worker服务, 向量搜索, 渐进式披露*