#!/usr/bin/env python3
"""
Claude-Mem数据库访问工具
提供完整的数据库查询、关键字筛选和项目过滤功能
"""

import sqlite3
import json
from datetime import datetime
from typing import List, Dict, Optional, Any
import re


class ClaudeMemDB:
    def __init__(self, db_path: str = None):
        """初始化数据库连接"""
        if db_path is None:
            import os
            db_path = os.path.expanduser("~/.claude-mem/claude-mem.db")
        
        self.db_path = db_path
        
        # 检查数据库文件是否存在
        import os
        if not os.path.exists(self.db_path):
            print(f"⚠️  数据库文件不存在: {self.db_path}")
            print("   请确保Claude-Mem已运行并创建了数据库")
        
        try:
            self.conn = sqlite3.connect(self.db_path)
            self.conn.row_factory = sqlite3.Row  # 允许按列名访问
            print(f"✅ 成功连接到数据库: {self.db_path}")
        except sqlite3.Error as e:
            print(f"❌ 数据库连接失败: {e}")
            raise

    def close(self):
        """关闭数据库连接"""
        if self.conn:
            self.conn.close()
            print("🔒 数据库连接已关闭")

    def get_projects(self) -> List[str]:
        """获取所有项目列表"""
        cursor = self.conn.execute("""
            SELECT DISTINCT project 
            FROM ai_responses 
            WHERE project IS NOT NULL
            ORDER BY project
        """)
        return [row['project'] for row in cursor.fetchall()]

    def get_project_stats(self, project: str = None) -> Dict[str, Any]:
        """获取项目统计信息"""
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
        return dict(result)

    def search_ai_responses(
        self, 
        keywords: List[str] = None, 
        logic: str = 'AND',
        project: str = None,
        limit: int = 100,
        offset: int = 0,
        response_type: str = None
    ) -> List[Dict[str, Any]]:
        """
        搜索AI回复
        
        Args:
            keywords: 关键字列表
            logic: 'AND' 或 'OR'，关键字匹配逻辑
            project: 项目名称过滤
            limit: 返回记录数限制
            offset: 偏移量
            response_type: 回复类型过滤 ('assistant', 'tool_result', 'error')
        """
        
        # 构建基础查询
        query = """
            SELECT 
                id, claude_session_id, sdk_session_id, project, prompt_number,
                response_text, response_type, tool_name, tool_input, tool_output,
                created_at, created_at_epoch
            FROM ai_responses
            WHERE 1=1
        """
        
        params = []
        
        # 添加项目过滤
        if project:
            query += " AND project = ?"
            params.append(project)
        
        # 添加回复类型过滤
        if response_type:
            query += " AND response_type = ?"
            params.append(response_type)
        
        # 添加关键字搜索
        if keywords:
            if logic.upper() == 'AND':
                # AND逻辑：所有关键字都必须匹配
                for keyword in keywords:
                    query += " AND response_text LIKE ?"
                    params.append(f"%{keyword}%")
            else:
                # OR逻辑：任意关键字匹配
                or_conditions = []
                for keyword in keywords:
                    or_conditions.append("response_text LIKE ?")
                    params.append(f"%{keyword}%")
                query += f" AND ({' OR '.join(or_conditions)})"
        
        # 添加排序和限制
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

    def get_user_prompts(
        self,
        project: str = None,
        limit: int = 100,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        """获取用户对话"""
        if not self.conn:
            return []
        
        query = """
            SELECT 
                id, claude_session_id, prompt_number, prompt_text,
                created_at, created_at_epoch
            FROM user_prompts
            WHERE 1=1
        """
        
        params = []
        
        if project:
            # 通过claude_session_id关联项目
            query += " AND claude_session_id IN (SELECT claude_session_id FROM sdk_sessions WHERE project = ?)"
            params.append(project)
        
        query += " ORDER BY created_at_epoch DESC LIMIT ? OFFSET ?"
        params.extend([limit, offset])
        
        try:
            cursor = self.conn.execute(query, params)
            results = []
            for row in cursor.fetchall():
                results.append({
                    'id': row['id'],
                    'claude_session_id': row['claude_session_id'],
                    'prompt_number': row['prompt_number'],
                    'prompt_text': row['prompt_text'],
                    'created_at': row['created_at'],
                    'created_at_epoch': row['created_at_epoch']
                })
            return results
        except sqlite3.Error as e:
            print(f"❌ 查询用户对话失败: {e}")
            return []

    def search_user_prompts_with_keywords(
        self,
        keywords: List[str],
        logic: str = 'AND',
        project: str = None,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """搜索用户对话（支持关键字）"""
        if not self.conn:
            return []
        
        query = """
            SELECT 
                id, claude_session_id, prompt_number, prompt_text,
                created_at, created_at_epoch
            FROM user_prompts up
            WHERE 1=1
        """
        
        params = []
        
        # 项目过滤
        if project:
            query += " AND up.claude_session_id IN (SELECT claude_session_id FROM sdk_sessions WHERE project = ?)"
            params.append(project)
        
        # 关键字搜索
        if keywords:
            if logic.upper() == 'AND':
                for keyword in keywords:
                    query += " AND up.prompt_text LIKE ?"
                    params.append(f"%{keyword}%")
            else:
                or_conditions = []
                for keyword in keywords:
                    or_conditions.append("up.prompt_text LIKE ?")
                    params.append(f"%{keyword}%")
                query += f" AND ({' OR '.join(or_conditions)})"
        
        query += " ORDER BY up.created_at_epoch DESC LIMIT ?"
        params.append(limit)
        
        try:
            cursor = self.conn.execute(query, params)
            results = []
            for row in cursor.fetchall():
                results.append({
                    'id': row['id'],
                    'claude_session_id': row['claude_session_id'],
                    'prompt_number': row['prompt_number'],
                    'prompt_text': row['prompt_text'],
                    'created_at': row['created_at'],
                    'created_at_epoch': row['created_at_epoch']
                })
            return results
        except sqlite3.Error as e:
            print(f"❌ 搜索用户对话失败: {e}")
            return []

    def search_all_conversations(
        self,
        keywords: List[str] = None,
        logic: str = 'AND',
        project: str = None,
        conversation_type: str = 'both',  # 'user', 'ai', 'both'
        limit: int = 100
    ) -> Dict[str, List[Dict[str, Any]]]:
        """统一搜索用户对话和AI回复
        
        Args:
            keywords: 关键字列表
            logic: 'AND' 或 'OR'，关键字匹配逻辑
            project: 项目名称过滤
            conversation_type: 对话类型 ('user', 'ai', 'both')
            limit: 返回记录数限制
        """
        results = {
            'user_prompts': [],
            'ai_responses': []
        }
        
        # 搜索用户对话
        if conversation_type in ['user', 'both']:
            results['user_prompts'] = self.search_user_prompts_with_keywords(
                keywords=keywords,
                logic=logic,
                project=project,
                limit=limit
            )
        
        # 搜索AI回复
        if conversation_type in ['ai', 'both']:
            results['ai_responses'] = self.search_ai_responses(
                keywords=keywords,
                logic=logic,
                project=project,
                limit=limit
            )
        
        return results

    def search_with_fts(
        self,
        keywords: List[str],
        logic: str = 'AND',
        project: str = None,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """
        使用FTS5全文搜索（更高效的搜索方式）
        """
        if not keywords:
            return []
        
        # 构建FTS查询
        if logic.upper() == 'AND':
            fts_query = ' AND '.join([f'"{keyword}"' for keyword in keywords])
        else:
            fts_query = ' OR '.join([f'"{keyword}"' for keyword in keywords])
        
        query = """
            SELECT 
                ar.id, ar.claude_session_id, ar.sdk_session_id, ar.project, 
                ar.prompt_number, ar.response_text, ar.response_type, 
                ar.tool_name, ar.tool_input, ar.tool_output,
                ar.created_at, ar.created_at_epoch
            FROM ai_responses ar
            JOIN ai_responses_fts fts ON ar.id = fts.rowid
            WHERE ai_responses_fts MATCH ?
        """
        
        params = [fts_query]
        
        if project:
            query += " AND ar.project = ?"
            params.append(project)
        
        query += " ORDER BY ar.created_at_epoch DESC LIMIT ?"
        params.append(limit)
        
        try:
            cursor = self.conn.execute(query, params)
            results = []
            for row in cursor.fetchall():
                results.append({
                    'id': row['id'],
                    'claude_session_id': row['claude_session_id'],
                    'project': row['project'],
                    'prompt_number': row['prompt_number'],
                    'response_text': row['response_text'],
                    'response_type': row['response_type'],
                    'tool_name': row['tool_name'],
                    'created_at': row['created_at']
                })
            return results
        except sqlite3.Error as e:
            print(f"❌ FTS搜索失败: {e}")
            return []

    def get_tool_executions(
        self,
        keywords: List[str] = None,
        project: str = None,
        tool_name: str = None,
        success_only: bool = False,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """获取工具执行记录"""
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
        results = []
        for row in cursor.fetchall():
            results.append(dict(row))
        return results

    def export_project_data(
        self, 
        project: str, 
        format: str = 'json',
        include_tool_executions: bool = True
    ) -> str:
        """导出项目数据"""
        # 获取AI回复
        responses = self.search_ai_responses(project=project, limit=10000)
        
        data = {
            'project': project,
            'exported_at': datetime.now().isoformat(),
            'stats': self.get_project_stats(project),
            'ai_responses': responses
        }
        
        if include_tool_executions:
            # 获取工具执行记录
            executions = self.get_tool_executions(project=project, limit=10000)
            data['tool_executions'] = executions
        
        if format.lower() == 'json':
            return json.dumps(data, indent=2, ensure_ascii=False)
        else:
            # 简单的Markdown格式
            markdown = f"# {project} 项目数据导出\n\n"
            markdown += f"导出时间: {data['exported_at']}\n\n"
            markdown += f"## 统计信息\n"
            markdown += f"- AI回复数: {data['stats']['ai_response_count']}\n"
            markdown += f"- 会话数: {data['stats']['session_count']}\n\n"
            
            markdown += f"## AI回复记录\n\n"
            for i, response in enumerate(responses, 1):
                markdown += f"### {i}. {response['response_type']} (会话: {response['claude_session_id']})\n"
                markdown += f"**时间**: {response['created_at']}\n\n"
                markdown += f"**内容**:\n```\n{response['response_text']}\n```\n\n"
                if response['tool_name']:
                    markdown += f"**工具**: {response['tool_name']}\n\n"
            
            return markdown


def main():
    """示例用法"""
    print("🔍 Claude-Mem数据库访问工具\n")
    
    # 初始化数据库连接
    db = ClaudeMemDB()
    
    try:
        # 1. 获取所有项目
        print("📋 所有项目列表:")
        projects = db.get_projects()
        for project in projects:
            print(f"  - {project}")
        print()
        
        if not projects:
            print("❌ 未找到任何项目")
            return
        
        # 选择第一个项目作为示例
        sample_project = projects[0]
        
        # 2. 项目统计信息
        print(f"📊 项目 '{sample_project}' 统计:")
        stats = db.get_project_stats(sample_project)
        print(f"  - AI回复数: {stats['ai_response_count']}")
        print(f"  - 会话数: {stats['session_count']}")
        print(f"  - 最早回复: {stats['earliest_response']}")
        print(f"  - 最新回复: {stats['latest_response']}")
        print()
        
        # 3. 基本查询示例
        print(f"🔍 查询项目 '{sample_project}' 的前5条AI回复:")
        responses = db.search_ai_responses(
            project=sample_project,
            limit=5
        )
        
        for response in responses:
            print(f"  [{response['id']}] {response['response_type']}")
            print(f"      会话: {response['claude_session_id']}")
            print(f"      内容: {response['response_text'][:100]}...")
            print()
        
        # 4. 关键字搜索示例
        print("🔍 关键字搜索示例 ('Python' AND '错误'):")
        keyword_results = db.search_ai_responses(
            keywords=['Python', '错误'],
            logic='AND',
            project=sample_project,
            limit=3
        )
        
        for result in keyword_results:
            print(f"  ✓ {result['response_text'][:80]}...")
        
        # 5. FTS搜索示例
        print("\n🔍 FTS全文搜索示例 ('API'):")
        fts_results = db.search_with_fts(
            keywords=['API'],
            project=sample_project,
            limit=3
        )
        
        for result in fts_results:
            print(f"  ✓ {result['response_text'][:80]}...")
        
        # 6. 工具执行记录查询
        print("\n🔧 查询工具执行记录:")
        executions = db.get_tool_executions(
            project=sample_project,
            limit=3
        )
        
        for exec in executions:
            status = "✅ 成功" if exec['success'] else "❌ 失败"
            print(f"  {status} - {exec['tool_name']} (会话: {exec['claude_session_id']})")
            if exec['error_message']:
                print(f"      错误: {exec['error_message']}")
        
        # 7. 数据导出示例
        print(f"\n📤 导出项目 '{sample_project}' 数据:")
        export_data = db.export_project_data(sample_project, format='json')
        print(f"  导出数据长度: {len(export_data)} 字符")
        
        # 保存到文件
        export_file = f"/tmp/{sample_project}_export.json"
        with open(export_file, 'w', encoding='utf-8') as f:
            f.write(export_data)
        print(f"  数据已保存到: {export_file}")
        
    except Exception as e:
        print(f"❌ 程序执行出错: {e}")
    
    finally:
        db.close()


if __name__ == "__main__":
    main()