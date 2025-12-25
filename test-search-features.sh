#!/bin/bash

echo "🧪 Claude-Mem 搜索功能测试"
echo "================================"

# 检查 worker 服务状态
echo "📡 检查 worker 服务状态..."
if curl -s http://localhost:37777/api/search/help > /dev/null; then
    echo "✅ Worker 服务运行正常"
else
    echo "❌ Worker 服务未运行，请启动服务"
    exit 1
fi

echo ""

# 测试各个搜索端点
echo "🔍 测试搜索 API 端点..."

# 1. 测试时间线搜索
echo "📅 测试时间线搜索..."
response=$(curl -s "http://localhost:37777/api/timeline?query=测试&limit=2")
if echo "$response" | grep -q "content"; then
    echo "✅ 时间线搜索 API 正常工作"
else
    echo "❌ 时间线搜索 API 异常"
fi

# 2. 测试决策搜索
echo "💡 测试决策搜索..."
response=$(curl -s "http://localhost:37777/api/decisions?limit=2")
if echo "$response" | grep -q "content"; then
    echo "✅ 决策搜索 API 正常工作"
else
    echo "❌ 决策搜索 API 异常"
fi

# 3. 测试变更搜索
echo "🔄 测试变更搜索..."
response=$(curl -s "http://localhost:37777/api/changes?limit=2")
if echo "$response" | grep -q "content"; then
    echo "✅ 变更搜索 API 正常工作"
else
    echo "❌ 变更搜索 API 异常"
fi

# 4. 测试工作原理搜索
echo "⚙️ 测试工作原理搜索..."
response=$(curl -s "http://localhost:37777/api/how-it-works?limit=2")
if echo "$response" | grep -q "content"; then
    echo "✅ 工作原理搜索 API 正常工作"
else
    echo "❌ 工作原理搜索 API 异常"
fi

# 5. 测试按概念搜索
echo "🏷️ 测试按概念搜索..."
response=$(curl -s "http://localhost:37777/api/search/by-concept?concept=测试&limit=2")
if echo "$response" | grep -q "content"; then
    echo "✅ 按概念搜索 API 正常工作"
else
    echo "❌ 按概念搜索 API 异常"
fi

# 6. 测试按文件搜索
echo "📄 测试按文件搜索..."
response=$(curl -s "http://localhost:37777/api/search/by-file?filePath=src&limit=2")
if echo "$response" | grep -q "content"; then
    echo "✅ 按文件搜索 API 正常工作"
else
    echo "❌ 按文件搜索 API 异常"
fi

# 7. 测试按类型搜索
echo "🏷️ 测试按类型搜索..."
response=$(curl -s "http://localhost:37777/api/search/by-type?type=test&limit=2")
if echo "$response" | grep -q "content"; then
    echo "✅ 按类型搜索 API 正常工作"
else
    echo "❌ 按类型搜索 API 异常"
fi

echo ""
echo "🎯 测试完成！"
echo ""
echo "📖 使用说明："
echo "1. 访问 http://localhost:37777/ 查看增强的搜索界面"
echo "2. 在搜索类型选择器中选择所需的搜索类型"
echo "3. 输入关键词进行搜索"
echo "4. 查看实时搜索结果"
echo ""
echo "🔧 开发文档："
echo "- SEARCH_FEATURES.md - 详细功能说明"
echo "- search-demo.html - 功能测试页面"
echo ""
echo "🚀 新增的搜索类型："
echo "  🔍 标准搜索 - 通用搜索接口"
echo "  📅 时间线搜索 - 按时间顺序查找事件"
echo "  💡 决策搜索 - 查找决策相关内容"
echo "  🔄 变更搜索 - 查找修改和更新"
echo "  ⚙️ 工作原理 - 查找技术说明"
echo "  🏷️ 按概念搜索 - 按标签分类查找"
echo "  📄 按文件搜索 - 查找文件相关内容"
echo "  🏷️ 按类型搜索 - 按观察类型分类"
