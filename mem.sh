#!/bin/bash

# Claude-Mem 快速启动脚本
# 用于启动、停止和管理 Claude-Mem 的 worker 服务

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 显示帮助信息
show_help() {
    echo -e "${BLUE}Claude-Mem 管理脚本${NC}"
    echo "========================"
    echo ""
    echo "用法:"
    echo "  ./mem.sh [命令]"
    echo ""
    echo "命令:"
    echo "  start     启动 Worker 服务 (默认)"
    echo "  stop      停止 Worker 服务"
    echo "  restart   重启 Worker 服务"
    echo "  status    查看服务状态"
    echo "  logs      查看服务日志"
    echo "  help      显示此帮助信息"
    echo ""
    echo "示例:"
    echo "  ./mem.sh        # 启动服务"
    echo "  ./mem.sh start  # 启动服务"
    echo "  ./mem.sh stop   # 停止服务"
}

# 检查是否在正确的目录
check_directory() {
    if [ ! -f "package.json" ]; then
        echo -e "${RED}❌ 错误: 请在项目根目录运行此脚本${NC}"
        exit 1
    fi
}

# 检查依赖
check_dependencies() {
    if ! command -v npm &> /dev/null; then
        echo -e "${RED}❌ 错误: 未找到 npm，请先安装 Node.js 和 npm${NC}"
        exit 1
    fi

    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}📦 检测到缺少依赖，正在安装...${NC}"
        npm install
        echo -e "${GREEN}✅ 依赖安装完成${NC}"
    fi
}

# 启动服务
start_service() {
    echo -e "${BLUE}🚀 启动 Claude-Mem Worker 服务...${NC}"
    echo "================================"

    # 检查服务是否已经在运行
    if curl -s http://localhost:37777/ > /dev/null 2>&1; then
        echo -e "${YELLOW}⚠️  服务已在运行中${NC}"
        echo -e "${BLUE}🌐 访问地址: http://localhost:37777/${NC}"
        return 0
    fi

    check_dependencies

    echo -e "${BLUE}🔧 启动 Worker 服务...${NC}"
    npm run worker:start &
    WORKER_PID=$!

    # 等待服务启动
    echo -e "${YELLOW}⏳ 等待服务启动...${NC}"
    for i in {1..10}; do
        if curl -s http://localhost:37777/ > /dev/null 2>&1; then
            echo -e "${GREEN}✅ 服务启动成功！${NC}"
            echo -e "${BLUE}🌐 访问地址: http://localhost:37777/${NC}"
            echo -e "${BLUE}📊 API 状态: http://localhost:37777/api/stats${NC}"
            return 0
        fi
        sleep 1
    done

    echo -e "${RED}❌ 服务启动失败，请检查日志${NC}"
    exit 1
}

# 停止服务
stop_service() {
    echo -e "${BLUE}🛑 停止 Claude-Mem Worker 服务...${NC}"

    # 尝试优雅停止
    pkill -f "worker-service" 2>/dev/null || true
    pkill -f "bun.*worker" 2>/dev/null || true

    # 等待进程结束
    sleep 2

    # 检查是否还有进程在运行
    if curl -s http://localhost:37777/ > /dev/null 2>&1; then
        echo -e "${YELLOW}⚠️  强制停止服务...${NC}"
        pkill -9 -f "worker-service" 2>/dev/null || true
        pkill -9 -f "bun.*worker" 2>/dev/null || true
    fi

    echo -e "${GREEN}✅ 服务已停止${NC}"
}

# 重启服务
restart_service() {
    echo -e "${BLUE}🔄 重启 Claude-Mem Worker 服务...${NC}"
    stop_service
    sleep 2
    start_service
}

# 查看服务状态
show_status() {
    echo -e "${BLUE}📊 Claude-Mem 服务状态${NC}"
    echo "====================="

    if curl -s http://localhost:37777/ > /dev/null 2>&1; then
        echo -e "${GREEN}🟢 服务状态: 运行中${NC}"
        echo -e "${BLUE}🌐 访问地址: http://localhost:37777/${NC}"

        # 获取服务统计信息
        if command -v curl &> /dev/null; then
            STATS=$(curl -s http://localhost:37777/api/stats 2>/dev/null || echo "{}")
            echo -e "${BLUE}📈 统计信息:${NC}"
            echo "$STATS" | grep -E '"(version|uptime|activeSessions|observations|sessions)"' | sed 's/^/  /' || true
        fi
    else
        echo -e "${RED}🔴 服务状态: 未运行${NC}"
    fi
}

# 查看服务日志
show_logs() {
    echo -e "${BLUE}📋 Claude-Mem 服务日志${NC}"
    echo "====================="

    LOG_FILE="$HOME/.claude-mem/logs/worker-$(date +%Y-%m-%d).log"

    if [ -f "$LOG_FILE" ]; then
        echo -e "${BLUE}📄 显示最新日志 (最后50行):${NC}"
        echo "========================"
        tail -n 50 "$LOG_FILE"
    else
        echo -e "${YELLOW}⚠️  未找到日志文件: $LOG_FILE${NC}"
        echo -e "${BLUE}🔍 查找其他可能的日志位置...${NC}"
        find "$HOME/.claude-mem" -name "*.log" 2>/dev/null | head -5 || echo "未找到日志文件"
    fi
}

# 主函数
main() {
    local command="${1:-start}"

    check_directory

    case "$command" in
        "start")
            start_service
            ;;
        "stop")
            stop_service
            ;;
        "restart")
            restart_service
            ;;
        "status")
            show_status
            ;;
        "logs")
            show_logs
            ;;
        "help"|"-h"|"--help")
            show_help
            ;;
        *)
            echo -e "${RED}❌ 未知命令: $command${NC}"
            echo ""
            show_help
            exit 1
            ;;
    esac
}

# 执行主函数
main "$@"