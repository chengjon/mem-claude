#!/bin/bash

# Claude-Mem GitHub Push Script
# This script pushes the committed changes to GitHub

echo "🚀 Pushing Claude-Mem changes to GitHub..."
echo "Repository: https://github.com/thedotmack/claude-mem.git"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Not in Claude-Mem project directory"
    echo "Please run this script from the project root directory"
    exit 1
fi

# Check git status
echo "📊 Checking git status..."
git status

echo ""
echo "📝 Commit message:"
git log -1 --pretty=format:"%s"

echo ""
echo "🔍 Files to be pushed:"
git diff --stat origin/main 2>/dev/null || echo "Unable to compare with origin"

echo ""
read -p "🤔 Do you want to push to GitHub? (y/N): " confirm

if [[ $confirm =~ ^[Yy]$ ]]; then
    echo ""
    echo "📤 Pushing to GitHub..."
    git push origin main
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ Successfully pushed to GitHub!"
        echo "🌐 View repository: https://github.com/thedotmack/claude-mem"
        echo "📋 Latest commit: https://github.com/thedotmack/claude-mem/commit/$(git rev-parse HEAD)"
    else
        echo ""
        echo "❌ Failed to push to GitHub"
        echo ""
        echo "🔧 Possible solutions:"
        echo "1. Check your internet connection"
        echo "2. Verify GitHub credentials: git remote -v"
        echo "3. Ensure you have write access to the repository"
        echo "4. Try: git remote set-url origin https://<username>:<token>@github.com/thedotmack/claude-mem.git"
    fi
else
    echo ""
    echo "🚫 Push cancelled by user"
fi

echo ""
echo "📊 Current branch status:"
git branch -vv

echo ""
echo "🎯 Next steps:"
echo "1. Visit https://github.com/thedotmack/claude-mem to view changes"
echo "2. Create a pull request if needed"
echo "3. Update release notes in CHANGELOG.md"
echo ""
