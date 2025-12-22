# Claude-Mem 数据库访问配置和使用指南

## 📋 目录
1. [数据库结构说明](#数据库结构说明)
2. [Python访问工具配置](#python访问工具配置)
3. [具体查询示例](#具体查询示例)
4. [HTTP API访问](#http-api访问)
5. [命令行工具](#命令行工具)

## 🗃️ 数据库结构说明

### 主要表结构

#### `ai_responses` 表 - AI回复记录
```sql
CREATE TABLE ai_responses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,           -- 唯一ID
    claude_session_id TEXT NOT NULL,               -- Claude会话ID
    sdk_session_id TEXT,                           -- SDK会话ID
    project TEXT NOT NULL,                         -- 项目名称
    prompt_number INTEGER NOT NULL,                -- 提示词编号
    response_text TEXT NOT NULL,                   -- AI回复内容
    response_type TEXT DEFAULT 'assistant' CHECK(response_type IN ('assistant', 'tool_result', 'error')),
    tool_name TEXT,                                -- 工具名称
    tool_input TEXT,                               -- 工具输入
    tool_output TEXT,                              -- 工具输出
    created_at TEXT NOT NULL,                      -- 创建时间
    created_at_epoch INTEGER NOT NULL              -- 创建时间戳
);
```

#### `tool_executions` 表 - 工具执行记录
```sql
CREATE TABLE tool_executions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ai_response_id INTEGER,                        -- 关联的AI回复ID
    claude_session_id TEXT NOT NULL,
    sdk_session_id TEXT,
    project TEXT NOT NULL,
    prompt_number INTEGER NOT NULL,
    tool_name TEXT NOT NULL,                       -- 执行的工具名
    tool_input TEXT,                               -- 工具输入参数
    tool_output TEXT,                              -- 工具输出结果
    tool_duration_ms INTEGER,                      -- 执行耗时(毫秒)
    files_created TEXT,                            -- 创建的文件列表(JSON)
    files_modified TEXT,                           -- 修改的文件列表(JSON)
    files_read TEXT,                               -- 读取的文件列表(JSON)
    files_deleted TEXT,                            -- 删除的文件列表(JSON)
    error_message TEXT,                            -- 错误信息
    success BOOLEAN DEFAULT TRUE,                  -- 执行是否成功
    created_at TEXT NOT NULL,
    created_at_epoch INTEGER NOT NULL
);
```

#### `sdk_sessions` 表 - 会话信息
```sql
CREATE TABLE sdk_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    claude_session_id TEXT UNIQUE NOT NULL,
    sdk_session_id TEXT UNIQUE,
    project TEXT NOT NULL,
    user_prompt TEXT,
    started_at TEXT NOT NULL,
    started_at_epoch INTEGER NOT NULL,
    completed_at TEXT,
    completed_at_epoch INTEGER,
    status TEXT CHECK(status IN ('active', 'completed', 'failed')) NOT NULL DEFAULT 'active'
);
```

### 全文搜索表 (FTS5)

#### `ai_responses_fts` 表
- 用于高效全文搜索AI回复内容
- 基于FTS5虚拟表技术

## 🐍 Python访问工具配置

### 1. 环境准备
```bash
# 确保Python环境可用
python3 --version

# 数据库文件路径检查
ls -la ~/.claude-mem/claude-mem.db
```

### 2. 工具安装和使用
```bash
# 赋予执行权限
chmod +x claude_mem_db_tool.py

# 基本使用
python3 claude_mem_db_tool.py

# 查看特定项目的回复
python3 -c "
from claude_mem_db_tool import ClaudeMemDB
db = ClaudeMemDB()
responses = db.search_ai_responses(project='my-project', limit=10)
for r in responses:
    print(f\"{r['created_at']}: {r['response_text'][:100]}...\")
db.close()
"
```

## 🔍 具体查询示例

### 查看特定项目的AI回复

#### 1. 获取项目列表
```python
from claude_mem_db_tool import ClaudeMemDB

db = ClaudeMemDB()
projects = db.get_projects()
print("可用项目:", projects)
db.close()
```

#### 2. 查看项目统计信息
```python
project_name = "my-awesome-project"
stats = db.get_project_stats(project_name)
print(f"项目 '{project_name}' 统计:")
print(f"  AI回复数: {stats['ai_response_count']}")
print(f"  会话数: {stats['session_count']}")
print(f"  时间范围: {stats['earliest_response']} ~ {stats['latest_response']}")
```

#### 3. 获取项目所有回复
```python
# 获取前100条回复
responses = db.search_ai_responses(
    project="my-project",
    limit=100,
    offset=0
)

for response in responses:
    print(f"[{response['id']}] {response['response_type']}")
    print(f"时间: {response['created_at']}")
    print(f"内容: {response['response_text']}")
    print("-" * 50)
```

### 关键字筛选查询

#### 1. 单个关键字搜索
```python
# 搜索包含"bug"的所有回复
bug_responses = db.search_ai_responses(
    keywords=["bug"],
    project="my-project",
    limit=50
)

print(f"找到 {len(bug_responses)} 条包含'bug'的回复")
for response in bug_responses:
    print(f"- {response['created_at']}: {response['response_text'][:80]}...")
```

#### 2. 多关键字AND逻辑搜索
```python
# 必须同时包含"Python"和"错误"的回复
python_errors = db.search_ai_responses(
    keywords=["Python", "错误"],
    logic="AND",
    project="my-project",
    limit=20
)

print(f"找到 {len(python_errors)} 条Python错误相关回复")
```

#### 3. 多关键字OR逻辑搜索
```python
# 包含"API"或"接口"任意一个的回复
api_responses = db.search_ai_responses(
    keywords=["API", "接口"],
    logic="OR",
    project="my-project",
    limit=30
)

print(f"找到 {len(api_responses)} 条API相关回复")
```

#### 4. 使用FTS高效搜索
```python
# 使用全文搜索引擎(更高效)
fts_results = db.search_with_fts(
    keywords=["数据库", "优化"],
    logic="AND",
    project="my-project",
    limit=20
)

print(f"FTS搜索找到 {len(fts_results)} 条相关回复")
```

### 高级筛选查询

#### 1. 按回复类型筛选
```python
# 只获取工具执行结果
tool_results = db.search_ai_responses(
    project="my-project",
    response_type="tool_result",
    limit=50
)

# 只获取错误回复
error_responses = db.search_ai_responses(
    project="my-project", 
    response_type="error",
    limit=20
)
```

#### 2. 工具执行记录查询
```python
# 查询特定工具的使用记录
python_executions = db.get_tool_executions(
    project="my-project",
    tool_name="python",
    limit=30
)

# 查询失败的工具执行
failed_executions = db.get_tool_executions(
    project="my-project",
    success_only=False,  # 包含失败的
    limit=20
)
```

#### 3. 复合条件查询
```python
# 查询包含特定关键字且失败的工具执行
complex_query = db.get_tool_executions(
    keywords=["权限", "permission"],
    project="my-project",
    success_only=False,
    limit=10
)
```

### 数据导出

#### 1. 导出项目数据为JSON
```python
# 导出完整项目数据
export_data = db.export_project_data(
    project="my-project",
    format="json",
    include_tool_executions=True
)

# 保存到文件
with open("my_project_export.json", "w", encoding="utf-8") as f:
    f.write(export_data)
```

#### 2. 导出为Markdown格式
```python
# 导出为可读的Markdown格式
md_export = db.export_project_data(
    project="my-project",
    format="markdown",
    include_tool_executions=True
)

with open("my_project_report.md", "w", encoding="utf-8") as f:
    f.write(md_export)
```

## 🌐 HTTP API访问

### API端点

#### 1. 获取AI回复列表
```bash
# 基本查询
curl "http://localhost:37777/api/ai-responses?limit=50"

# 按项目过滤
curl "http://localhost:37777/api/ai-responses?project=my-project&limit=20"

# 关键字搜索
curl "http://localhost:37777/api/ai-responses?keywords=bug,error&logic=OR&limit=30"

# 组合条件
curl "http://localhost:37777/api/ai-responses?project=my-project&keywords=API&logic=AND&limit=25"
```

#### 2. 获取工具执行记录
```bash
# 工具执行记录
curl "http://localhost:37777/api/tool-executions?limit=50"

# 按项目过滤
curl "http://localhost:37777/api/tool-executions?project=my-project&limit=30"

# 按工具名过滤
curl "http://localhost:37777/api/tool-executions?tool_name=python&limit=20"
```

#### 3. API参数说明
- `limit`: 返回记录数限制 (1-100, 默认20)
- `offset`: 偏移量，用于分页
- `project`: 项目名称过滤
- `keywords`: 关键字列表，逗号分隔
- `logic`: 关键字匹配逻辑 (`AND` 或 `OR`)
- `response_type`: 回复类型 (`assistant`, `tool_result`, `error`)

## 💻 命令行工具

### 使用提供的Python工具
```bash
# 查看帮助
python3 claude_mem_db_tool.py --help

# 执行完整示例
python3 claude_mem_db_tool.py

# 自定义查询
python3 -c "
from claude_mem_db_tool import ClaudeMemDB
db = ClaudeMemDB()
# 自定义查询逻辑
db.close()
"
```

## 📊 性能优化建议

### 1. 使用索引
数据库已创建以下索引：
- `idx_ai_responses_project`: 项目过滤
- `idx_ai_responses_created`: 时间排序
- `idx_ai_responses_fts`: 全文搜索

### 2. 搜索策略
- 小数据量(< 1000条): 使用LIKE搜索
- 大数据量: 使用FTS5全文搜索
- 精确匹配: 使用索引字段过滤

### 3. 分页处理
```python
# 使用分页避免内存溢出
page_size = 100
offset = 0
while True:
    responses = db.search_ai_responses(
        project="my-project",
        limit=page_size,
        offset=offset
    )
    if not responses:
        break
    
    # 处理当前页数据
    process_responses(responses)
    
    offset += page_size
```

## 🔒 安全注意事项

1. **数据库文件权限**: 确保数据库文件权限设置正确
2. **敏感信息过滤**: 避免导出包含敏感信息的回复
3. **访问控制**: 在生产环境中使用API认证
4. **备份策略**: 定期备份数据库文件

## 📝 常用查询模板

### 快速查询模板
```python
# 模板1: 查看项目最新回复
def get_latest_responses(project, limit=10):
    return db.search_ai_responses(project=project, limit=limit)

# 模板2: 搜索问题相关回复
def search_issues(project, keywords):
    return db.search_ai_responses(
        project=project, 
        keywords=keywords, 
        logic='OR', 
        limit=50
    )

# 模板3: 获取错误信息
def get_errors(project, limit=20):
    return db.search_ai_responses(
        project=project,
        response_type='error',
        limit=limit
    )
```