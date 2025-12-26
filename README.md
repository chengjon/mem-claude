# Claude-Mem 智能对话记忆系统

一个专为Claude Code设计的持久化记忆压缩系统，能够自动记录、分析和检索AI对话，支持关键词搜索、项目管理和AI集成。

<p align="center">
  <img src="https://img.shields.io/badge/version-7.4.6-green.svg" alt="Version">
  <img src="https://img.shields.io/badge/License-AGPL%203.0-blue.svg" alt="License">
  <img src="https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg" alt="Node">
  <img src="https://img.shields.io/badge/language-TypeScript-orange.svg" alt="Language">
</p>

---

## 🚀 快速开始

### 安装命令

```bash
/plugin marketplace add chengjon/mem-claude
/plugin install mem-claude
```

重启Claude Code，上下文将自动从之前的会话中加载。

### 核心特性

- 🧠 **持久化记忆** - 跨会话上下文自动加载
- 🔍 **关键词搜索** - 支持AND/OR逻辑的全文搜索
- 🤖 **AI集成** - 完整的外部AI系统集成方案
- 📊 **对话分类** - 区分用户对话和AI回复
- 🛠️ **工具跟踪** - 完整的工具执行历史记录
- 💻 **Web界面** - 实时查看对话历史 http://localhost:37777
- 🔒 **隐私控制** - 支持`<private>`标签排除敏感内容
- ⚙️ **自动操作** - 无需手动干预，全自动记录和分析

---

## 🎯 主要功能

### 1. 智能记忆管理

Claude-Mem自动捕获工具使用观察结果，生成语义摘要，并在新会话中自动加载相关上下文。

**工作流程：**
```
会话开始 → 自动注入相关上下文
     ↓
用户提示 → 创建会话，保存用户对话
     ↓  
工具执行 → 捕获观察结果（读取、写入等）
     ↓
智能处理 → 通过Claude Agent SDK提取学习内容
     ↓
会话结束 → 生成摘要，为下个会话做准备
```

### 2. 关键词过滤与搜索

**Web界面搜索：**
- 右上角搜索框输入关键词
- 支持多个关键词（逗号分隔）
- 可选择AND/OR逻辑
- 实时过滤结果

**API搜索：**
```bash
# 搜索AI回复
curl "http://localhost:37777/api/ai-responses?keywords=bug,error&logic=OR"

# 搜索用户对话
curl "http://localhost:37777/api/search-conversations?keywords=Python&type=user"
```

### 3. AI集成工具

**Python数据库工具：**
```python
from claude_mem_db_tool import ClaudeMemDB

db = ClaudeMemDB()

# 搜索包含特定关键词的AI回复
bug_conversations = db.search_ai_responses(
    keywords=["bug", "修复"],
    logic="AND",
    limit=50
)

# 搜索用户对话
user_questions = db.search_user_prompts(
    keywords=["如何", "实现"],
    limit=30
)

db.close()
```

**CLI搜索工具：**
```bash
# 搜索所有对话
python search_conversations.py --keywords "数据库" --logic OR

# 只搜索AI对话
python search_conversations.py --keywords "错误" --type ai

# 导出结果
python search_conversations.py --keywords "优化" --output results.json
```

**AI集成示例：**
```python
from ai_integration_examples import ClaudeMemAIIntegration

integration = ClaudeMemAIIntegration()

# 获取相关上下文
context = integration.get_relevant_context(
    query="如何解决Python数据库连接问题？",
    project="my-project",
    limit=5
)

# 分析对话模式
patterns = integration.analyze_conversation_patterns("my-project")

# 获取解决方案历史
solutions = integration.get_solution_history(
    problem_type="database",
    project="my-project"
)
```

### 4. 服务管理

**一键服务管理：**
```bash
# 启动服务
./mem.sh start

# 查看状态
./mem.sh status

# 查看日志
./mem.sh logs

# 重启服务
./mem.sh restart

# 停止服务
./mem.sh stop
```

**手动管理：**
```bash
# 启动worker服务
npm run worker:start

# 查看服务状态
npm run worker:status

# 查看日志
npm run worker:logs

# 重启服务
npm run worker:restart
```

### 5. Web界面功能

访问 http://localhost:37777 查看完整的对话历史：

- **实时更新** - 新对话自动刷新
- **项目筛选** - 按项目分组查看
- **关键词搜索** - 高级搜索和过滤
- **对话分类** - 用户对话 vs AI回复
- **工具历史** - 完整的工具执行记录
- **分页浏览** - 支持大量数据的分页显示

---

## 🔧 API接口

### 核心API端点

**获取AI回复：**
```bash
GET /api/ai-responses
参数：
- keywords: 关键词列表（逗号分隔）
- logic: AND/OR 逻辑
- project: 项目名称
- limit: 数量限制
- offset: 偏移量
```

**搜索对话：**
```bash
GET /api/search-conversations
参数：
- keywords: 关键词列表
- logic: AND/OR 逻辑  
- type: user/ai/both
- project: 项目名称
```

**获取工具执行记录：**
```bash
GET /api/tool-executions
参数：
- project: 项目名称
- limit: 数量限制
- offset: 偏移量
```

**统计数据：**
```bash
GET /api/stats
返回：
- version: 版本号
- uptime: 运行时间
- activeSessions: 活跃会话数
- observations: 观察记录数
- sessions: 会话总数
```

---

## 📦 数据导出

### JSON格式导出
```bash
# 导出所有数据
curl "http://localhost:37777/api/ai-responses?limit=10000" > conversations.json

# 导出特定项目
curl "http://localhost:37777/api/ai-responses?project=my-project&limit=1000" > my-project-conversations.json
```

### Python导出
```python
from claude_mem_db_tool import ClaudeMemDB

db = ClaudeMemDB()

# 导出项目报告
md_report = db.export_project_data(
    project="my-project",
    format="markdown",
    include_tool_executions=True
)

with open("project-report.md", "w", encoding="utf-8") as f:
    f.write(md_report)

print("报告已保存到 project-report.md")
```

---

## 🎮 高级用法

### 自定义关键词搜索
```python
# 搜索包含特定技术栈的对话
tech_stack_search = db.search_ai_responses(
    keywords=["React", "TypeScript", "Node.js"],
    logic="AND",
    project="frontend-project",
    limit=30
)

# 搜索错误和解决方案
error_solutions = db.search_ai_responses(
    keywords=["错误", "解决方案", "修复"],
    logic="OR",
    limit=50
)
```

### 工具执行记录分析
```python
# 查看工具使用统计
tool_usage = db.get_tool_executions(
    project="my-project",
    limit=100
)

# 分析成功率
successful_tools = [t for t in tool_usage if t['success']]
success_rate = len(successful_tools) / len(tool_usage) * 100

print(f"工具执行成功率: {success_rate:.1f}%")
```

### 集成到其他AI系统
```python
# 集成到您的AI助手中
class ClaudeMemIntegration:
    def __init__(self):
        self.base_url = "http://localhost:37777"
    
    def get_context(self, query, project=None):
        """为AI助手获取相关上下文"""
        params = {
            "keywords": query.split(),
            "logic": "AND",
            "limit": 5
        }
        if project:
            params["project"] = project
        
        response = requests.get(f"{self.base_url}/api/ai-responses", params=params)
        return [item['response_text'] for item in response.json()['items']]
    
    def search_solutions(self, problem):
        """搜索类似问题的解决方案"""
        return self.get_context(problem)

# 使用示例
mem_integration = ClaudeMemIntegration()
context = mem_integration.get_context("Python数据库连接问题")
```

---

## 🔧 系统要求

- **Node.js**: 18.0.0 或更高版本
- **Claude Code**: 最新版本，支持插件
- **Bun**: JavaScript运行时和进程管理器（自动安装）
- **SQLite 3**: 持久化存储（内置）

---

## 📊 数据存储位置

- **数据库**: `~/.mem-claude/mem-claude.db`
- **PID文件**: `~/.mem-claude/.worker.pid`
- **端口文件**: `~/.mem-claude/.worker.port`
- **日志文件**: `~/.mem-claude/logs/worker-YYYY-MM-DD.log`
- **配置文件**: `~/.mem-claude/settings.json`

环境变量覆盖：
```bash
export CLAUDE_MEM_DATA_DIR=/custom/path
```

---

## 🐛 故障排除

### 常见问题

**服务无法启动：**
```bash
# 检查端口占用
lsof -i :37777

# 杀死占用端口的进程
kill -9 $(lsof -t -i:37777)

# 重新启动
./mem.sh start
```

**看不到对话记录：**
```bash
# 检查数据库文件
ls -la ~/.mem-claude/

# 查看服务日志
./mem.sh logs

# 确认插件已安装
/plugin list | grep mem-claude
```

**关键词搜索不工作：**
```bash
# 检查API是否正常
curl "http://localhost:37777/api/ai-responses?limit=1"

# 检查数据库是否有数据
python3 -c "
from claude_mem_db_tool import ClaudeMemDB
db = ClaudeMemDB()
print('项目数量:', len(db.get_projects()))
db.close()
"
```

### 诊断工具
```bash
# 运行完整诊断
npm run test:context

# 查看服务状态
./mem.sh status

# 查看详细日志
./mem.sh logs
```

---

## 📚 文档资源

- **完整文档**: `docs/` 目录
- **快速开始**: `QUICK_START.md`
- **数据库访问**: `DATABASE_ACCESS_GUIDE.md`
- **API文档**: http://localhost:37777/api/docs
- **迁移指南**: `MIGRATION_GUIDE.md`

---

## 🔗 相关链接

- **项目仓库**: https://github.com/chengjon/mem-claude
- **问题反馈**: https://github.com/chengjon/mem-claude/issues
- **功能建议**: https://github.com/chengjon/mem-claude/discussions

---

## 📋 更新日志

**v7.4.6 - 关键词过滤与AI集成 (2025-12-22)**
- ✨ **关键词过滤**: 支持AND/OR逻辑的关键词搜索
- ✨ **AI集成工具**: 完整的外部AI系统集成方案
- ✨ **对话分类**: 区分用户对话和AI回复
- ✨ **工具跟踪**: 完整的工具执行历史记录
- 🔧 **服务管理**: 一键服务生命周期管理
- 📚 **增强文档**: 完整的API和集成指南

---

**Claude-Mem** - 让AI对话拥有记忆，让知识持续积累 💡