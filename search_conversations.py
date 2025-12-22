#!/usr/bin/env python3
"""
Claude-Mem 对话区分搜索工具
支持区分用户对话和AI回复的搜索工具
"""

import requests
import json
from typing import List, Dict, Optional, Any
import argparse
import sys


class ClaudeMemConversationSearcher:
    def __init__(self, base_url: str = "http://localhost:37777"):
        """初始化搜索器
        
        Args:
            base_url: Claude-Mem API基础URL
        """
        self.base_url = base_url.rstrip('/')
        self.session = requests.Session()
    
    def search_conversations(
        self,
        keywords: List[str] = None,
        project: str = None,
        conversation_type: str = 'both',  # 'user', 'ai', 'both'
        logic: str = 'AND',
        limit: int = 50
    ) -> Dict[str, Any]:
        """搜索对话记录
        
        Args:
            keywords: 关键字列表
            project: 项目名称过滤
            conversation_type: 对话类型 ('user', 'ai', 'both')
            logic: 关键字匹配逻辑 ('AND', 'OR')
            limit: 返回记录数限制
        
        Returns:
            包含用户对话和AI回复的字典
        """
        params = {
            'limit': limit,
            'conversation_type': conversation_type,
            'logic': logic
        }
        
        if project:
            params['project'] = project
            
        if keywords:
            params['keywords'] = ','.join(keywords)
        
        try:
            response = self.session.get(
                f"{self.base_url}/api/search-conversations",
                params=params,
                timeout=10
            )
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"❌ API请求失败: {e}")
            return {'user_prompts': [], 'ai_responses': []}
    
    def search_user_prompts(
        self,
        keywords: List[str] = None,
        project: str = None,
        logic: str = 'AND',
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """只搜索用户对话"""
        result = self.search_conversations(
            keywords=keywords,
            project=project,
            conversation_type='user',
            logic=logic,
            limit=limit
        )
        return result.get('user_prompts', [])
    
    def search_ai_responses(
        self,
        keywords: List[str] = None,
        project: str = None,
        logic: str = 'AND',
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """只搜索AI回复"""
        result = self.search_conversations(
            keywords=keywords,
            project=project,
            conversation_type='ai',
            logic=logic,
            limit=limit
        )
        return result.get('ai_responses', [])
    
    def format_results(self, results: Dict[str, Any], show_both: bool = True) -> str:
        """格式化搜索结果"""
        output = []
        
        if show_both:
            output.append("=" * 60)
            output.append("🔍 Claude-Mem 对话搜索结果")
            output.append("=" * 60)
        
        # 用户对话
        user_prompts = results.get('user_prompts', [])
        if user_prompts:
            output.append(f"\n👤 用户对话 ({len(user_prompts)} 条):")
            output.append("-" * 40)
            for i, prompt in enumerate(user_prompts, 1):
                output.append(f"\n{i}. 用户提示 #{prompt['id']}")
                output.append(f"   项目: {prompt.get('project', 'N/A')}")
                output.append(f"   会话: {prompt.get('claude_session_id', 'N/A')[:20]}...")
                output.append(f"   时间: {prompt.get('created_at', 'N/A')}")
                output.append(f"   内容: {prompt.get('prompt_text', 'N/A')[:200]}...")
        
        # AI回复
        ai_responses = results.get('ai_responses', [])
        if ai_responses:
            output.append(f"\n🤖 AI回复 ({len(ai_responses)} 条):")
            output.append("-" * 40)
            for i, response in enumerate(ai_responses, 1):
                output.append(f"\n{i}. AI回复 #{response['id']}")
                output.append(f"   项目: {response.get('project', 'N/A')}")
                output.append(f"   会话: {response.get('claude_session_id', 'N/A')[:20]}...")
                output.append(f"   时间: {response.get('created_at', 'N/A')}")
                output.append(f"   类型: {response.get('response_type', 'N/A')}")
                if response.get('tool_name'):
                    output.append(f"   工具: {response['tool_name']}")
                output.append(f"   内容: {response.get('response_text', 'N/A')[:200]}...")
        
        if not user_prompts and not ai_responses:
            output.append("\n❌ 未找到匹配的对话记录")
        
        return "\n".join(output)
    
    def export_results(self, results: Dict[str, Any], format: str = 'json', filename: str = None) -> str:
        """导出搜索结果"""
        if format.lower() == 'json':
            data = json.dumps(results, indent=2, ensure_ascii=False)
            if filename:
                with open(filename, 'w', encoding='utf-8') as f:
                    f.write(data)
            return data
        
        elif format.lower() == 'markdown':
            md_content = self.format_results(results)
            if filename:
                with open(filename, 'w', encoding='utf-8') as f:
                    f.write(md_content)
            return md_content
        
        else:
            raise ValueError(f"不支持的导出格式: {format}")


def main():
    """命令行工具主函数"""
    parser = argparse.ArgumentParser(
        description='Claude-Mem 对话搜索工具',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
使用示例:
  # 搜索包含"bug"的用户对话
  python3 search_conversations.py --keywords bug --type user
  
  # 搜索包含"Python"和"错误"的AI回复
  python3 search_conversations.py --keywords "Python,错误" --type ai --logic OR
  
  # 搜索特定项目的所有对话
  python3 search_conversations.py --project my-project --type both
  
  # 导出搜索结果
  python3 search_conversations.py --keywords error --export json --output results.json
        """
    )
    
    parser.add_argument(
        '--keywords', '-k',
        help='搜索关键字 (逗号分隔)',
        type=str
    )
    
    parser.add_argument(
        '--project', '-p',
        help='项目名称过滤',
        type=str
    )
    
    parser.add_argument(
        '--type', '-t',
        choices=['user', 'ai', 'both'],
        default='both',
        help='对话类型 (默认: both)'
    )
    
    parser.add_argument(
        '--logic', '-l',
        choices=['AND', 'OR'],
        default='AND',
        help='关键字匹配逻辑 (默认: AND)'
    )
    
    parser.add_argument(
        '--limit', 
        type=int,
        default=20,
        help='返回记录数限制 (默认: 20)'
    )
    
    parser.add_argument(
        '--url',
        default='http://localhost:37777',
        help='Claude-Mem API地址 (默认: http://localhost:37777)'
    )
    
    parser.add_argument(
        '--export',
        choices=['json', 'markdown'],
        help='导出格式'
    )
    
    parser.add_argument(
        '--output', '-o',
        help='输出文件名'
    )
    
    parser.add_argument(
        '--quiet', '-q',
        action='store_true',
        help='静默模式，只输出结果'
    )
    
    args = parser.parse_args()
    
    # 解析关键字
    keywords = None
    if args.keywords:
        keywords = [k.strip() for k in args.keywords.split(',') if k.strip()]
    
    # 初始化搜索器
    searcher = ClaudeMemConversationSearcher(args.url)
    
    # 执行搜索
    if not args.quiet:
        print(f"🔍 搜索中...")
        if keywords:
            print(f"   关键字: {keywords}")
        if args.project:
            print(f"   项目: {args.project}")
        print(f"   类型: {args.type}")
        print(f"   逻辑: {args.logic}")
        print()
    
    results = searcher.search_conversations(
        keywords=keywords,
        project=args.project,
        conversation_type=args.type,
        logic=args.logic,
        limit=args.limit
    )
    
    # 输出结果
    if args.export:
        content = searcher.export_results(results, args.export, args.output)
        if not args.quiet:
            print(f"✅ 结果已导出到: {args.output or 'stdout'}")
    else:
        formatted_output = searcher.format_results(results)
        if args.output:
            with open(args.output, 'w', encoding='utf-8') as f:
                f.write(formatted_output)
            if not args.quiet:
                print(f"✅ 结果已保存到: {args.output}")
        else:
            print(formatted_output)


if __name__ == "__main__":
    main()