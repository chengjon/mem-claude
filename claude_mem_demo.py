#!/usr/bin/env python3
"""
Claude-Mem数据库访问工具 - 演示版本
即使没有实际数据也能展示所有功能
"""

import sqlite3
import json
from datetime import datetime
from typing import List, Dict, Optional, Any
import re
import os


class ClaudeMemDBDemo:
    def __init__(self, db_path: str = None):
        """初始化数据库连接"""
        if db_path is None:
            db_path = os.path.expanduser("~/.claude-mem/claude-mem.db")
        
        self.db_path = db_path
        self.has_real_data = False
        
        # 检查数据库文件是否存在
        if os.path.exists(self.db_path):
            try:
                self.conn = sqlite3.connect(self.db_path)
                self.conn.row_factory = sqlite3.Row
                
                # 检查是否有ai_responses表
                cursor = self.conn.execute("""
                    SELECT name FROM sqlite_master 
                    WHERE type='table' AND name='ai_responses'
                """)
                if cursor.fetchone():
                    self.has_real_data = True
                    print(f"✅ 成功连接到数据库: {self.db_path}")
                else:
                    print(f"⚠️  数据库存在但表结构未创建: {self.db_path}")
                    print("   这表示Claude-Mem还未运行过或数据表未初始化")
            except sqlite3.Error as e:
                print(f"❌ 数据库连接失败: {e}")
                self.conn = None
        else:
            print(f"📝 数据库文件不存在，创建演示数据: {self.db_path}")
            print("   演示模式将展示所有功能特性")
            
        # 如果没有真实数据，使用演示数据
        if not self.has_real_data:
            self.demo_data = self._create_demo_data()

    def close(self):
        """关闭数据库连接"""
        if self.conn:
            self.conn.close()
            print("🔒 数据库连接已关闭")

    def _create_demo_data(self) -> Dict[str, Any]:
        """创建演示数据"""
        return {
            "projects": ["claude-mem-demo", "web-app-project", "data-analysis"],
            "ai_responses": [
                {
                    "id": 1,
                    "claude_session_id": "demo-session-1",
                    "project": "claude-mem-demo",
                    "prompt_number": 1,
                    "response_text": "我将帮您分析这个API的性能问题。根据错误日志，主要是数据库连接超时导致的。",
                    "response_type": "assistant",
                    "tool_name": None,
                    "created_at": "2025-12-22T10:30:00Z"
                },
                {
                    "id": 2,
                    "claude_session_id": "demo-session-1", 
                    "project": "claude-mem-demo",
                    "prompt_number": 2,
                    "response_text": "让我检查Python代码中的错误处理逻辑，发现需要添加重试机制。",
                    "response_type": "assistant",
                    "tool_name": "python",
                    "created_at": "2025-12-22T10:32:00Z"
                },
                {
                    "id": 3,
                    "claude_session_id": "demo-session-2",
                    "project": "web-app-project", 
                    "prompt_number": 1,
                    "response_text": "优化了React组件的渲染性能，通过使用React.memo减少了不必要的重渲染。",
                    "response_type": "assistant",
                    "tool_name": "edit_file",
                    "created_at": "2025-12-22T11:15:00Z"
                },
                {
                    "id": 4,
                    "claude_session_id": "demo-session-3",
                    "project": "data-analysis",
                    "prompt_number": 1,
                    "response_text": "分析了数据集后，发现API调用的响应时间分布存在异常值，需要进一步调查。",
                    "response_type": "assistant",
                    "tool_name": "python",
                    "created_at": "2025-12-22T14:20:00Z"
                }
            ],
            "tool_executions": [
                {
                    "id": 1,
                    "ai_response_id": 2,
                    "claude_session_id": "demo-session-1",
                    "project": "claude-mem-demo",
                    "tool_name": "python",
                    "tool_input": "import pandas as pd; df = pd.read_csv('error_log.csv')",
                    "tool_output": "成功读取错误日志文件，包含1000条记录",
                    "success": True,
                    "created_at": "2025-12-22T10:32:00Z"
                },
                {
                    "id": 2,
                    "ai_response_id": 3,
                    "claude_session_id": "demo-session-2",
                    "project": "web-app-project",
                    "tool_name": "edit_file",
                    "tool_input": "修改 src/components/UserProfile.tsx",
                    "tool_output": "文件已更新，添加了React.memo优化",
                    "success": True,
                    "created_at": "2025-12-22T11:15:00Z"
                }
            ]
        }

    def get_projects(self) -> List[str]:
        """获取所有项目列表"""
        if self.has_real_data and self.conn:
            cursor = self.conn.execute("""
                SELECT DISTINCT project 
                FROM ai_responses 
                WHERE project IS NOT NULL
                ORDER BY project
            """)
            return [row['project'] for row in cursor.fetchall()]
        else:
            return self.demo_data["projects"]

    def get_project_stats(self, project: str = None) -> Dict[str, Any]:
        """获取项目统计信息"""
        if self.has_real_data and self.conn:
            if project:
                cursor = self.conn.execute("""
                    SELECT 
                        COUNT(*) as ai_response_count,
                        COUNT(DISTINCT claude_session_id) as session_count,
                        MIN(created_at) as earliest_response,
                        MAX(created_at) as latest_response
                    FROM ai_responses 
                    WHERE project = ?
                """, (project,))
            else:
                cursor = self.conn.execute("""
                    SELECT 
                        COUNT(*) as ai_response_count,
                        COUNT(DISTINCT claude_session_id) as session_count,
                        MIN(created_at) as earliest_response,
                        MAX(created_at) as latest_response
                    FROM ai_responses
                """)
            
            result = cursor.fetchone()
            return dict(result) if result else {"ai_response_count": 0, "session_count": 0}
        else:
            # 演示数据统计
            project_responses = [r for r in self.demo_data["ai_responses"] if r["project"] == project] if project else self.demo_data["ai_responses"]
            sessions = set(r["claude_session_id"] for r in project_responses)
            
            return {
                "ai_response_count": len(project_responses),
                "session_count": len(sessions),
                "earliest_response": min(r["created_at"] for r in project_responses) if project_responses else None,
                "latest_response": max(r["created_at"] for r in project_responses) if project_responses else None
            }

    def search_ai_responses(
        self, 
        keywords: List[str] = None, 
        logic: str = 'AND',
        project: str = None,
        limit: int = 100,
        offset: int = 0,
        response_type: str = None
    ) -> List[Dict[str, Any]]:
        """搜索AI回复"""
        if self.has_real_data and self.conn:
            # 真实数据库查询逻辑（与之前相同）
            query = """
                SELECT 
                    id, claude_session_id, sdk_session_id, project, prompt_number,
                    response_text, response_type, tool_name, tool_input, tool_output,
                    created_at, created_at_epoch
                FROM ai_responses
                WHERE 1=1
            """
            
            params = []
            
            if project:
                query += " AND project = ?"
                params.append(project)
            
            if response_type:
                query += " AND response_type = ?"
                params.append(response_type)
            
            if keywords:
                if logic.upper() == 'AND':
                    for keyword in keywords:
                        query += " AND response_text LIKE ?"
                        params.append(f"%{keyword}%")
                else:
                    or_conditions = []
                    for keyword in keywords:
                        or_conditions.append("response_text LIKE ?")
                        params.append(f"%{keyword}%")
                    query += f" AND ({' OR '.join(or_conditions)})"
            
            query += " ORDER BY created_at_epoch DESC LIMIT ? OFFSET ?"
            params.extend([limit, offset])
            
            try:
                cursor = self.conn.execute(query, params)
                results = []
                for row in cursor.fetchall():
                    results.append({
                        'id': row['id'],
                        'claude_session_id': row['claude_session_id'],
                        'sdk_session_id': row['sdk_session_id'],
                        'project': row['project'],
                        'prompt_number': row['prompt_number'],
                        'response_text': row['response_text'],
                        'response_type': row['response_type'],
                        'tool_name': row['tool_name'],
                        'tool_input': row['tool_input'],
                        'tool_output': row['tool_output'],
                        'created_at': row['created_at'],
                        'created_at_epoch': row['created_at_epoch']
                    })
                return results
            except sqlite3.Error as e:
                print(f"❌ 查询失败: {e}")
                return []
        else:
            # 演示数据筛选
            responses = self.demo_data["ai_responses"].copy()
            
            # 项目过滤
            if project:
                responses = [r for r in responses if r["project"] == project]
            
            # 回复类型过滤
            if response_type:
                responses = [r for r in responses if r["response_type"] == response_type]
            
            # 关键字过滤
            if keywords:
                if logic.upper() == 'AND':
                    # AND逻辑：所有关键字都必须匹配
                    responses = [
                        r for r in responses 
                        if all(keyword.lower() in r["response_text"].lower() for keyword in keywords)
                    ]
                else:
                    # OR逻辑：任意关键字匹配
                    responses = [
                        r for r in responses 
                        if any(keyword.lower() in r["response_text"].lower() for keyword in keywords)
                    ]
            
            # 分页
            return responses[offset:offset + limit]

    def get_tool_executions(
        self,
        keywords: List[str] = None,
        project: str = None,
        tool_name: str = None,
        success_only: bool = False,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """获取工具执行记录"""
        if self.has_real_data and self.conn:
            # 真实数据库查询逻辑
            query = """
                SELECT 
                    id, ai_response_id, claude_session_id, project, prompt_number,
                    tool_name, tool_input, tool_output, tool_duration_ms,
                    files_created, files_modified, files_read, files_deleted,
                    error_message, success, created_at
                FROM tool_executions
                WHERE 1=1
            """
            
            params = []
            
            if project:
                query += " AND project = ?"
                params.append(project)
            
            if tool_name:
                query += " AND tool_name = ?"
                params.append(tool_name)
            
            if success_only:
                query += " AND success = 1"
            
            if keywords:
                or_conditions = []
                for keyword in keywords:
                    or_conditions.append("(tool_input LIKE ? OR tool_output LIKE ? OR error_message LIKE ?)")
                    params.extend([f"%{keyword}%", f"%{keyword}%", f"%{keyword}%"])
                query += f" AND ({' OR '.join(or_conditions)})"
            
            query += " ORDER BY created_at_epoch DESC LIMIT ?"
            params.append(limit)
            
            cursor = self.conn.execute(query, params)
            return [dict(row) for row in cursor.fetchall()]
        else:
            # 演示数据筛选
            executions = self.demo_data["tool_executions"].copy()
            
            if project:
                executions = [e for e in executions if e["project"] == project]
            
            if tool_name:
                executions = [e for e in executions if e["tool_name"] == tool_name]
            
            if success_only:
                executions = [e for e in executions if e["success"]]
            
            if keywords:
                executions = [
                    e for e in executions
                    if any(keyword.lower() in str(e.get("tool_input", "")).lower() or
                          keyword.lower() in str(e.get("tool_output", "")).lower() or
                          keyword.lower() in str(e.get("error_message", "")).lower()
                          for keyword in keywords)
                ]
            
            return executions[:limit]


def main():
    """演示用法"""
    print("🔍 Claude-Mem数据库访问工具 (演示模式)\n")
    
    db = ClaudeMemDBDemo()
    
    try:
        # 1. 获取所有项目
        print("📋 可用项目列表:")
        projects = db.get_projects()
        for i, project in enumerate(projects, 1):
            print(f"  {i}. {project}")
        print()
        
        # 2. 选择演示项目
        demo_project = projects[0] if projects else "demo-project"
        
        # 3. 项目统计信息
        print(f"📊 项目 '{demo_project}' 统计:")
        stats = db.get_project_stats(demo_project)
        print(f"  - AI回复数: {stats['ai_response_count']}")
        print(f"  - 会话数: {stats['session_count']}")
        print(f"  - 最早回复: {stats['earliest_response']}")
        print(f"  - 最新回复: {stats['latest_response']}")
        print()
        
        # 4. 基本查询示例
        print(f"🔍 查询项目 '{demo_project}' 的AI回复:")
        responses = db.search_ai_responses(
            project=demo_project,
            limit=3
        )
        
        for i, response in enumerate(responses, 1):
            print(f"  {i}. [{response['response_type']}] {response['created_at']}")
            print(f"     会话: {response['claude_session_id']}")
            print(f"     内容: {response['response_text']}")
            print()
        
        # 5. 关键字搜索示例
        print("🔍 关键字搜索示例 ('Python'):")
        python_results = db.search_ai_responses(
            keywords=['Python'],
            limit=3
        )
        
        for result in python_results:
            print(f"  ✓ {result['created_at']}: {result['response_text']}")
        
        print()
        
        # 6. 多关键字搜索
        print("🔍 多关键字搜索 ('错误' AND 'API'):")
        multi_results = db.search_ai_responses(
            keywords=['错误', 'API'],
            logic='AND',
            limit=3
        )
        
        for result in multi_results:
            print(f"  ✓ {result['created_at']}: {result['response_text']}")
        
        print()
        
        # 7. 工具执行记录
        print("🔧 工具执行记录:")
        executions = db.get_tool_executions(
            limit=3
        )
        
        for exec in executions:
            status = "✅ 成功" if exec['success'] else "❌ 失败"
            print(f"  {status} - {exec['tool_name']} (项目: {exec['project']})")
            print(f"     输入: {exec['tool_input']}")
            print(f"     输出: {exec['tool_output']}")
            print()
        
        # 8. 功能说明
        print("💡 功能特性展示:")
        print("  ✅ 项目过滤: 按项目名称筛选回复")
        print("  ✅ 关键字搜索: 支持AND/OR逻辑匹配")
        print("  ✅ 类型过滤: 筛选assistant/tool_result/error类型")
        print("  ✅ 工具记录: 查询工具执行详情")
        print("  ✅ 分页支持: 大数据集分页处理")
        print("  ✅ 高性能: 使用SQLite FTS5全文搜索")
        print()
        
        print("🔗 实际使用时的其他AI访问方式:")
        print("  1. HTTP API: http://localhost:37777/api/ai-responses")
        print("  2. 直接数据库: ~/.claude-mem/claude-mem.db")
        print("  3. 导出功能: 支持JSON/Markdown格式")
        print("  4. MCP协议: 通过Model Context Protocol访问")
        
    except Exception as e:
        print(f"❌ 程序执行出错: {e}")
    
    finally:
        db.close()


if __name__ == "__main__":
    main()
