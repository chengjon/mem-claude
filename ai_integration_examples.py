#!/usr/bin/env python3
"""
其他AI集成Claude-Mem的示例代码
展示如何区分用户对话和AI回复进行搜索和分析
"""

import requests
import json
from typing import List, Dict, Any, Optional
from datetime import datetime


class ClaudeMemAIIntegration:
    """
    其他AI集成Claude-Mem的示例类
    提供多种搜索和分析功能
    """
    
    def __init__(self, base_url: str = "http://localhost:37777"):
        self.base_url = base_url.rstrip('/')
        self.session = requests.Session()
    
    def get_relevant_context(self, query: str, project: str = None, conversation_types: List[str] = ['both']) -> Dict[str, Any]:
        """为AI助手获取相关上下文"""
        keywords = query.lower().split()
        
        results = {
            'user_questions': [],
            'ai_solutions': [],
            'related_discussions': []
        }
        
        # 搜索用户问题和AI解决方案
        for conv_type in conversation_types:
            params = {
                'keywords': ','.join(keywords),
                'logic': 'OR',
                'limit': 10,
                'conversation_type': conv_type
            }
            
            if project:
                params['project'] = project
            
            try:
                response = self.session.get(f"{self.base_url}/api/search-conversations", params=params)
                data = response.json()
                
                if conv_type in ['user', 'both']:
                    results['user_questions'].extend(data.get('user_prompts', []))
                
                if conv_type in ['ai', 'both']:
                    results['ai_solutions'].extend(data.get('ai_responses', []))
                    
            except Exception as e:
                print(f"搜索失败: {e}")
        
        return results
    
    def analyze_user_intent(self, user_message: str, project: str = None) -> Dict[str, Any]:
        """分析用户意图，查找相关的历史对话"""
        # 提取关键字
        keywords = self._extract_keywords(user_message)
        
        # 搜索相关的用户对话
        user_results = self._search_user_prompts(keywords, project, limit=5)
        
        # 搜索相关的AI回复
        ai_results = self._search_ai_responses(keywords, project, limit=5)
        
        analysis = {
            'extracted_keywords': keywords,
            'similar_user_questions': user_results,
            'relevant_ai_responses': ai_results,
            'context_recommendations': self._generate_recommendations(user_results, ai_results)
        }
        
        return analysis
    
    def get_solution_history(self, problem_description: str, project: str = None) -> Dict[str, Any]:
        """获取类似问题的解决历史"""
        keywords = self._extract_keywords(problem_description)
        
        # 搜索相关的AI回复（可能包含解决方案）
        ai_responses = self._search_ai_responses(keywords, project, limit=10)
        
        # 筛选可能包含解决方案的回复
        solution_keywords = ['解决', '方案', '修复', '建议', 'solution', 'fix', 'recommend']
        solutions = []
        
        for response in ai_responses:
            text = response.get('response_text', '').lower()
            if any(keyword in text for keyword in solution_keywords):
                solutions.append(response)
        
        return {
            'problem_keywords': keywords,
            'related_solutions': solutions,
            'total_found': len(solutions)
        }
    
    def get_conversation_flow(self, session_id: str) -> Dict[str, Any]:
        """获取特定会话的完整对话流程"""
        # 这里需要实现获取特定会话的完整对话流程
        # 暂时返回示例结构
        return {
            'session_id': session_id,
            'user_prompts': [],
            'ai_responses': [],
            'timeline': []
        }
    
    def _extract_keywords(self, text: str) -> List[str]:
        """从文本中提取关键字"""
        # 简单的关键字提取（实际应用中可以使用更复杂的NLP）
        import re
        
        # 移除标点符号并分词
        words = re.findall(r'\b\w+\b', text.lower())
        
        # 过滤常见停用词
        stop_words = {'的', '了', '在', '是', '我', '你', '他', '她', '它', '这', '那', '一个', '什么', '怎么', '为什么', '如何'}
        keywords = [word for word in words if word not in stop_words and len(word) > 1]
        
        return keywords[:10]  # 最多返回10个关键字
    
    def _search_user_prompts(self, keywords: List[str], project: str = None, limit: int = 10) -> List[Dict[str, Any]]:
        """搜索用户提示"""
        params = {
            'keywords': ','.join(keywords),
            'logic': 'OR',
            'limit': limit,
            'conversation_type': 'user'
        }
        
        if project:
            params['project'] = project
        
        try:
            response = self.session.get(f"{self.base_url}/api/search-conversations", params=params)
            return response.json().get('user_prompts', [])
        except:
            return []
    
    def _search_ai_responses(self, keywords: List[str], project: str = None, limit: int = 10) -> List[Dict[str, Any]]:
        """搜索AI回复"""
        params = {
            'keywords': ','.join(keywords),
            'logic': 'OR',
            'limit': limit,
            'conversation_type': 'ai'
        }
        
        if project:
            params['project'] = project
        
        try:
            response = self.session.get(f"{self.base_url}/api/search-conversations", params=params)
            return response.json().get('ai_responses', [])
        except:
            return []
    
    def _generate_recommendations(self, user_questions: List[Dict], ai_responses: List[Dict]) -> List[str]:
        """生成推荐建议"""
        recommendations = []
        
        if user_questions:
            recommendations.append(f"发现 {len(user_questions)} 个相关的历史用户问题")
        
        if ai_responses:
            recommendations.append(f"找到 {len(ai_responses)} 个相关的AI回复")
        
        if not user_questions and not ai_responses:
            recommendations.append("未找到相关的历史对话")
        
        return recommendations


# 示例AI助手类，展示如何集成Claude-Mem
class ExampleAIAssistant:
    def __init__(self):
        self.mem_integration = ClaudeMemAIIntegration()
    
    def respond_to_user(self, user_message: str, project: str = None) -> str:
        """AI助手响应用户，集成记忆搜索"""
        
        # 1. 获取相关上下文
        context = self.mem_integration.get_relevant_context(
            query=user_message,
            project=project
        )
        
        # 2. 分析用户意图
        intent_analysis = self.mem_integration.analyze_user_intent(
            user_message=user_message,
            project=project
        )
        
        # 3. 构建响应
        response_parts = []
        
        # 添加上下文信息
        if context['user_questions']:
            response_parts.append("根据您之前的类似问题：")
            for q in context['user_questions'][:2]:
                response_parts.append(f"• {q['prompt_text'][:100]}...")
        
        if context['ai_solutions']:
            response_parts.append("\n相关解决方案：")
            for sol in context['ai_solutions'][:2]:
                response_parts.append(f"• {sol['response_text'][:100]}...")
        
        # 4. 生成主响应
        main_response = self._generate_main_response(user_message, context)
        response_parts.insert(0, main_response)
        
        return "\n\n".join(response_parts)
    
    def _generate_main_response(self, user_message: str, context: Dict[str, Any]) -> str:
        """生成主要响应内容"""
        # 这里应该是AI的主要响应逻辑
        # 示例：基于上下文生成响应
        if context['user_questions'] or context['ai_solutions']:
            return f"我注意到您的问题与之前的对话相关。基于历史记录，我可以为您提供更有针对性的帮助。"
        else:
            return "这是一个新的问题，我将为您提供全面的解答。"


def demo_integration():
    """演示AI集成功能"""
    print("🤖 Claude-Mem AI集成演示\n")
    
    # 初始化集成
    integration = ClaudeMemAIIntegration()
    
    # 示例1: 获取相关上下文
    print("1️⃣ 获取相关上下文示例:")
    context = integration.get_relevant_context(
        query="Python数据库连接问题",
        project="web-project"
    )
    print(f"   用户问题: {len(context['user_questions'])} 条")
    print(f"   AI回复: {len(context['ai_solutions'])} 条")
    print()
    
    # 示例2: 分析用户意图
    print("2️⃣ 用户意图分析示例:")
    analysis = integration.analyze_user_intent(
        user_message="我的React组件渲染很慢，有什么优化方法吗？",
        project="frontend-project"
    )
    print(f"   提取关键字: {analysis['extracted_keywords']}")
    print(f"   推荐: {analysis['context_recommendations']}")
    print()
    
    # 示例3: 解决方案历史
    print("3️⃣ 解决方案历史示例:")
    solutions = integration.get_solution_history(
        problem_description="API响应时间过长",
        project="backend-project"
    )
    print(f"   找到解决方案: {solutions['total_found']} 个")
    print(f"   问题关键字: {solutions['problem_keywords']}")
    print()
    
    # 示例4: AI助手响应
    print("4️⃣ AI助手集成示例:")
    assistant = ExampleAIAssistant()
    response = assistant.respond_to_user(
        user_message="如何优化数据库查询性能？",
        project="data-project"
    )
    print("AI助手响应:")
    print(response)


def api_examples():
    """展示API使用示例"""
    print("\n📡 API使用示例:\n")
    
    base_url = "http://localhost:37777"
    
    # 1. 搜索用户对话
    print("🔍 搜索用户对话:")
    print(f"""
    curl "{base_url}/api/search-conversations?keywords=bug,error&conversation_type=user&logic=OR"
    """)
    
    # 2. 搜索AI回复
    print("🤖 搜索AI回复:")
    print(f"""
    curl "{base_url}/api/search-conversations?keywords=Python&conversation_type=ai&limit=10"
    """)
    
    # 3. 搜索所有对话
    print("🔄 搜索所有对话:")
    print(f"""
    curl "{base_url}/api/search-conversations?keywords=API&conversation_type=both&project=my-project"
    """)


if __name__ == "__main__":
    print("🚀 Claude-Mem AI集成示例\n")
    
    # 运行演示
    demo_integration()
    
    # 显示API示例
    api_examples()
    
    print("\n💡 使用建议:")
    print("1. 在AI助手的初始化阶段创建ClaudeMemAIIntegration实例")
    print("2. 在处理用户消息前调用get_relevant_context获取上下文")
    print("3. 使用analyze_user_intent分析用户意图")
    print("4. 将历史对话作为上下文提供给主AI模型")
    print("5. 定期清理和更新搜索索引以提高性能")