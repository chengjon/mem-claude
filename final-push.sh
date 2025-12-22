#!/bin/bash

# Claude-Mem GitHub Push Script - Final Version
# This script pushes all committed changes to GitHub

set -e

echo "🚀 Claude-Mem GitHub Push Script"
echo "=================================="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Not in Claude-Mem project directory"
    echo "Please run this script from the project root directory"
    exit 1
fi

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}📊 Current Status:${NC}"
echo "Repository: https://github.com/thedotmack/claude-mem.git"
echo ""

# Check git status
echo -e "${BLUE}🔍 Git Status:${NC}"
git status --porcelain | head -10
echo ""

# Show recent commits
echo -e "${BLUE}📝 Recent Commits:${NC}"
git log --oneline -n 3
echo ""

# Show files to be pushed
echo -e "${BLUE}📁 Files Summary:${NC}"
echo "Commits ahead of origin/main: $(git rev-list --count HEAD ^origin/main 2>/dev/null || echo "unknown")"
echo ""

# Check if there are commits to push
if git rev-list --count HEAD ^origin/main 2>/dev/null | grep -q "0"; then
    echo -e "${YELLOW}⚠️  Warning: No commits to push or unable to compare with origin${NC}"
    echo ""
fi

echo -e "${BLUE}🚀 Ready to push!${NC}"
echo ""

# Show what will be pushed
echo -e "${BLUE}📤 This will push:${NC}"
git log --oneline HEAD~3..HEAD 2>/dev/null | while read commit msg; do
    echo "  • $commit: $msg"
done

echo ""
echo -e "${YELLOW}⚠️  Make sure you have:${NC}"
echo "  • GitHub access credentials configured"
echo "  • Write permissions to the repository"
echo "  • Stable internet connection"
echo ""

read -p "🤔 Continue with push to GitHub? (y/N): " confirm

if [[ $confirm =~ ^[Yy]$ ]]; then
    echo ""
    echo -e "${GREEN}📤 Pushing to GitHub...${NC}"
    
    # Try to push
    if git push origin main; then
        echo ""
        echo -e "${GREEN}✅ Successfully pushed to GitHub!${NC}"
        echo ""
        echo -e "${BLUE}🌐 Repository Links:${NC}"
        echo "  • Main repo: https://github.com/thedotmack/claude-mem"
        echo "  • Latest commit: https://github.com/thedotmack/claude-mem/commit/$(git rev-parse HEAD)"
        echo "  • Compare changes: https://github.com/thedotmack/claude-mem/compare/main...HEAD"
        echo ""
        echo -e "${BLUE}🎯 Next Steps:${NC}"
        echo "  1. Visit the repository to verify changes"
        echo "  2. Create a release tag for version 7.4.6"
        echo "  3. Update documentation if needed"
        echo "  4. Notify users about new features"
        echo ""
        echo -e "${GREEN}🎉 Push completed successfully!${NC}"
    else
        echo ""
        echo -e "${RED}❌ Failed to push to GitHub${NC}"
        echo ""
        echo -e "${YELLOW}🔧 Troubleshooting:${NC}"
        echo "1. Check your internet connection"
        echo "2. Verify GitHub credentials:"
        echo "   git remote -v"
        echo "3. Update credentials if needed:"
        echo "   git remote set-url origin https://<username>:<token>@github.com/thedotmack/claude-mem.git"
        echo "4. Check repository permissions"
        echo "5. Try pushing with verbose output:"
        echo "   git push origin main --verbose"
    fi
else
    echo ""
    echo -e "${YELLOW}🚫 Push cancelled by user${NC}"
    echo ""
    echo -e "${BLUE}💡 To push later, run:${NC}"
    echo "   git push origin main"
    echo ""
    echo -e "${BLUE}📊 Current branch status:${NC}"
    git branch -vv
fi

echo ""
echo -e "${BLUE}📋 Final Summary:${NC}"
echo "Project: Claude-Mem Memory Compression System"
echo "Version: 7.4.6 (includes keyword filtering & AI conversation differentiation)"
echo "Commits to push: $(git rev-list --count HEAD ^origin/main 2>/dev/null || echo "unknown")"
echo ""
echo -e "${BLUE}🔗 Useful Links:${NC}"
echo "  • Repository: https://github.com/thedotmack/claude-mem"
echo "  • Issues: https://github.com/thedotmack/claude-mem/issues"
echo "  • Wiki: https://github.com/thedotmack/claude-mem/wiki"
echo ""
