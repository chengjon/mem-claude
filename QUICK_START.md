# Claude-Mem 快速开始指南

## 🚀 一分钟快速开始

Claude-Mem是一个智能的对话记忆系统，能够自动记录和分析您与Claude的对话，支持关键字搜索、项目管理和AI集成。

### 📦 安装

#### 方式一：直接安装（推荐）
```bash
# 克隆项目
git clone https://github.com/chengjon/mem-claude.git
cd mem-claude

# 安装依赖
npm install

# 构建项目
npm run build

# 启动服务
./mem.sh start
```

#### 方式二：全局安装
```bash
npm install -g claude-mem
mem start
```

### ⚡ 快速使用

#### 1. 启动服务
```bash
# 启动Claude-Mem服务
./mem.sh start

# 查看服务状态
./mem.sh status

# 查看日志
./mem.sh logs
```

#### 2. 在Claude中使用
在Claude Code中，系统会自动记录您的对话到Claude-Mem中，无需额外操作。

#### 3. 查看记忆
打开浏览器访问：http://localhost:37777

### 🎯 核心功能使用

#### 查看所有对话
```bash
# 通过Web界面查看
# 访问 http://localhost:37777

# 或使用数据库工具
python3 claude_mem_db_tool.py
```

#### 按项目分类查看
```bash
# Web界面选择项目筛选
# 或使用API
curl "http://localhost:37777/api/ai-responses?project=my-project"
```

#### 关键字搜索
```bash
# Web界面右上角搜索框输入关键字
# 支持多个关键字（逗号分隔）
# 可选择AND/OR逻辑

# 或使用API
curl "http://localhost:37777/api/ai-responses?keywords=bug,error&logic=OR"
```

### 🤖 AI集成 - 让其他AI读取对话记录

#### 1. HTTP API方式（最简单）

**Python示例：**
```python
import requests

def search_my_conversations(keywords, project=None):
    """让AI搜索我的Claude对话记录"""
    params = {
        "keywords": ",".join(keywords),
        "logic": "AND",
        "limit": 50
    }
    if project:
        params["project"] = project
    
    response = requests.get("http://localhost:37777/api/ai-responses", params=params)
    return response.json()

# 使用示例
results = search_my_conversations(["Python", "错误"], "my-project")
for result in results["items"]:
    print(f"时间: {result['created_at']}")
    print(f"内容: {result['response_text']}")
    print("---")
```

**其他AI调用示例：**
```javascript
// JavaScript/Node.js
const axios = require('axios');

async function getMyConversations(keywords) {
    const response = await axios.get('http://localhost:37777/api/ai-responses', {
        params: {
            keywords: keywords.join(','),
            logic: 'OR',
            limit: 20
        }
    });
    return response.data;
}

// 在其他AI中使用
getMyConversations(['API', '优化']).then(data => {
    console.log('找到相关对话:', data.items.length, '条');
});
```

#### 2. 直接数据库访问

**Python工具：**
```python
# 下载数据库访问工具
wget https://raw.githubusercontent.com/chengjon/mem-claude/main/claude_mem_db_tool.py

# 使用示例
from claude_mem_db_tool import ClaudeMemDB

db = ClaudeMemDB()

# 搜索包含"bug"的对话
bug_conversations = db.search_ai_responses(
    keywords=["bug"],
    limit=50
)

for conv in bug_conversations:
    print(f"项目: {conv['project']}")
    print(f"内容: {conv['response_text'][:100]}...")
    print()

db.close()
```

#### 3. MCP协议集成

**适用于Claude Code插件：**
```json
{
  "tools": {
    "read_my_claude_memories": {
      "description": "读取我的Claude对话记忆",
      "parameters": {
        "type": "object",
        "properties": {
          "keywords": {
            "type": "array",
            "items": {"type": "string"},
            "description": "搜索关键字"
          },
          "project": {
            "type": "string", 
            "description": "项目名称"
          },
          "limit": {
            "type": "number",
            "default": 20,
            "description": "返回数量限制"
          }
        }
      }
    }
  }
}
```

### 📊 数据导出

#### 导出为JSON
```bash
# 导出所有数据
curl "http://localhost:37777/api/ai-responses?limit=10000" > conversations.json

# 导出特定项目
curl "http://localhost:37777/api/ai-responses?project=my-project&limit=1000" > my-project-conversations.json
```

#### 导出为Markdown
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

### 🔧 常用命令

#### 服务管理
```bash
./mem.sh start    # 启动服务
./mem.sh stop     # 停止服务
./mem.sh restart  # 重启服务
./mem.sh status   # 查看状态
./mem.sh logs     # 查看日志
```

#### 数据库操作
```bash
# 查看数据库位置
ls -la ~/.claude-mem/claude-mem.db

# 备份数据库
cp ~/.claude-mem/claude-mem.db ~/.claude-mem/claude-mem.db.backup

# 清理数据库
./mem.sh stop
rm ~/.claude-mem/claude-mem.db
./mem.sh start
```

### 🎮 高级功能

#### 自定义关键字搜索
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

#### 工具执行记录分析
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

### 🔗 集成到其他AI系统

#### 1. 本地AI助手集成
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

#### 2. 知识库系统集成
```python
# 将Claude对话转换为知识库条目
def create_knowledge_base():
    db = ClaudeMemDB()
    
    knowledge_items = []
    responses = db.search_ai_responses(limit=1000)
    
    for response in responses:
        knowledge_items.append({
            "id": response['id'],
            "title": response['response_text'][:50] + "...",
            "content": response['response_text'],
            "project": response['project'],
            "tags": extract_tags(response['response_text']),
            "created_at": response['created_at']
        })
    
    return knowledge_items
```

### 🐛 常见问题

#### Q: 服务无法启动？
```bash
# 检查端口占用
lsof -i :37777

# 杀死占用端口的进程
kill -9 $(lsof -t -i:37777)

# 重新启动
./mem.sh start
```

#### Q: 看不到对话记录？
```bash
# 检查数据库文件
ls -la ~/.claude-mem/

# 查看服务日志
./mem.sh logs

# 确认Claude Code插件已安装
# 在Claude中检查是否有claude-mem相关的hook
```

#### Q: 关键字搜索不工作？
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

### 📚 更多资源

- **完整文档**: `DATABASE_ACCESS_GUIDE.md`
- **API文档**: http://localhost:37777/api/docs
- **项目地址**: https://github.com/chengjon/mem-claude

### 💡 使用技巧

1. **定期备份**: 重要对话记得备份数据库
2. **合理分类**: 使用项目名称组织不同类型的对话
3. **关键字策略**: 使用技术术语、错误信息等作为关键字
4. **定期清理**: 删除过期的测试项目，保持数据库性能

---

🎉 **恭喜！您现在可以使用Claude-Mem来记录、搜索和分析您的AI对话了！**

需要帮助？请查看完整文档或提交Issue。