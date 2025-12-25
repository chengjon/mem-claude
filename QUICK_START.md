# 🚀 Claude-Mem Quick Start Guide

**Persistent AI memory for Claude Code - Never forget what you've learned**

> **What is Claude-Mem?**: An intelligent memory system that automatically captures your work, extracts insights using AI, and makes everything searchable across sessions.

---

## ⚡ 5-Minute Setup

### Prerequisites

- **Node.js 18+** (for build tools only)
- **Bun** (auto-installed if needed)
- **uv** (optional, for semantic search)

### Installation

```bash
# Clone the repository
git clone https://github.com/chengjon/mem-claude.git
cd mem-claude

# Install dependencies
npm install

# Build the project
npm run build

# Start the worker
npm run worker:start
```

### Verify Installation

```bash
# Check worker health
curl http://localhost:37777/health

# Expected response: {"status":"ok","timestamp":...}

# Check readiness
curl http://localhost:37777/api/readiness

# Expected response: {"status":"ready","mcpReady":true}
```

**That's it!** 🎉 Claude-Mem is now running and will automatically:
- ✅ Capture your tool usage
- ✅ Extract observations using AI
- ✅ Generate session summaries
- ✅ Index everything for search

---

## 💡 Basic Usage

### 1. Automatic Memory Capture

Claude-Mem works **automatically** in the background. Just use Claude Code normally:

```
Your prompt: "Help me debug this authentication error"
Claude: [works on the problem]
→ Claude-Mem automatically captures:
   - Tool usage (files read, edited)
   - Decisions made
   - Solutions discovered
```

### 2. Search Your Memory

Use the built-in search skill to find past work:

```
You: /mem search "authentication error"

→ Returns relevant observations from previous sessions:
   - How you fixed similar issues before
   - What solutions worked
   - Related code and files
```

### 3. Automatic Context Injection

When you start a new session, Claude-Mem automatically injects relevant context:

```
You: "How do I handle user login again?"

Claude: [already knows from your past work]
→ "Based on your previous work on this project, you use JWT tokens..."
```

---

## 🎯 Common Workflows

### Workflow 1: "How did I solve this before?"

```bash
# Search for the problem
/mem search "CORS error"

# Get detailed solution with context
→ Returns:
   - What the problem was
   - How you fixed it
   - Code examples
   - Related decisions
```

### Workflow 2: "What did I work on recently?"

```bash
# Get recent context
curl http://localhost:37777/api/context/recent

# Browse by project
curl http://localhost:37777/api/projects

# View timeline
curl "http://localhost:37777/api/timeline?query=database"
```

### Workflow 3: "Show me database-related work"

```bash
# Search by keyword
curl "http://localhost:37777/api/search?query=database" | jq '.'

# Filter by type
curl "http://localhost:37777/api/decisions?limit=10" | jq '.'

# Search specific files
curl "http://localhost:37777/api/search/by-file?filePath=Database.ts" | jq '.'
```

---

## 📊 Web UI

### View Your Memory

```bash
# Open viewer in browser
open http://localhost:37777

# Features:
# - Browse all observations
# - Search with filters
# - View session summaries
# - Timeline visualization
# - Export data
```

### What You'll See

- **Observations**: AI-extracted insights from your work
- **Sessions**: Complete session histories
- **Summaries**: AI-generated overviews
- **Timeline**: Chronological view of work
- **Projects**: Organized by repository

---

## 🔍 Search Examples

### Basic Search

```bash
# Simple keyword search
curl "http://localhost:37777/api/search?query=authentication" | jq '.'

# Multiple keywords
curl "http://localhost:37777/api/search?query=user+login+error" | jq '.'

# Limit results
curl "http://localhost:37777/api/search?query=test&limit=5" | jq '.'
```

### Semantic Shortcuts

```bash
# Find decisions
curl "http://localhost:37777/api/decisions?limit=10" | jq '.'

# Find bug fixes
curl "http://localhost:37777/api/changes?limit=10" | jq '.'

# Find explanations
curl "http://localhost:37777/api/how-it-works?limit=10" | jq '.'
```

### Timeline Search

```bash
# Timeline around specific event
curl "http://localhost:37777/api/timeline?anchor=123" | jq '.'

# Timeline for query
curl "http://localhost:37777/api/timeline?query=refactoring" | jq '.'
```

---

## 🛠️ Configuration

### Settings File

**Location**: `~/.claude-mem/settings.json`

```json
{
  // AI Model (default: claude-sonnet-4-5)
  "CLAUDE_MEM_MODEL": "claude-sonnet-4-5",

  // Worker port (default: 37777)
  "CLAUDE_MEM_WORKER_PORT": 37777,

  // Worker host (default: 127.0.0.1)
  "CLAUDE_MEM_WORKER_HOST": "127.0.0.1",

  // Observations to inject at SessionStart
  "CLAUDE_MEM_CONTEXT_OBSERVATIONS": 10,

  // Data directory
  "CLAUDE_MEM_DATA_DIR": "~/.claude-mem"
}
```

### Changing Settings

```bash
# Edit settings
nano ~/.claude-mem/settings.json

# Restart worker to apply
npm run worker:restart
```

---

## 🐛 Troubleshooting

### Worker Not Running?

```bash
# Check status
curl http://localhost:37777/health

# Start worker
npm run worker:start

# View logs
tail -f ~/.claude-mem/logs/worker-service.log

# Restart worker
npm run worker:restart
```

### Port Already in Use?

```bash
# Find what's using port 37777
lsof -i :37777

# Kill the process
kill -9 <PID>

# Or change port in settings.json
# "CLAUDE_MEM_WORKER_PORT": 37778
```

### Memory Not Being Captured?

```bash
# Check readiness
curl http://localhost:37777/api/readiness

# Should return: {"status":"ready","mcpReady":true}

# If mcpReady is false:
# 1. Check bun installation
which bun

# 2. Check worker logs
tail -50 ~/.claude-mem/logs/worker-service.log

# 3. Restart worker
npm run worker:restart
```

### Search Not Working?

```bash
# Check database has data
curl http://localhost:37777/api/stats | jq '.database'

# Should show observations > 0

# If 0 observations:
# 1. Verify plugin is installed
ls -la ~/.claude/plugins/marketplaces/chengjon/

# 2. Check for errors
tail -50 ~/.claude-mem/logs/worker-service.log
```

---

## 📚 API Quick Reference

### Core Endpoints

```bash
# Health check
GET /health

# Readiness check
GET /api/readiness

# Statistics
GET /api/stats

# Unified search
GET /api/search?query=<keyword>

# Timeline
GET /api/timeline?query=<keyword>

# Recent context
GET /api/context/recent?limit=10

# Decisions
GET /api/decisions?limit=10

# Changes
GET /api/changes?limit=10
```

### Response Format

All endpoints return consistent JSON:

```json
{
  "content": [{
    "type": "text",
    "text": "Response data..."
  }],
  "isError": false
}
```

### Full API Documentation

```bash
# Get inline help
curl http://localhost:37777/api/search/help | jq '.'

# Or visit web UI
open http://localhost:37777
```

---

## 🎓 Tips & Best Practices

### 1. Be Descriptive in Your Work

```
❌ Vague:
"Fix the bug"

✅ Descriptive:
"Fix authentication bug where users with spaces in names can't log in due to JWT token parsing"
```

### 2. Use Privacy Tags

```
<private>This content won't be stored in memory</private>

Use for:
- API keys and secrets
- Personal information
- Temporary debug code
- Sensitive business logic
```

### 3. Check Context Regularly

```bash
# Before starting work, see what you did last
curl http://localhost:37777/api/context/recent | jq '.'

# Get context for specific topic
curl "http://localhost:37777/api/search?query=current+project" | jq '.'
```

### 4. Review Session Summaries

```bash
# See what AI learned from your session
curl http://localhost:37777/api/summaries?limit=5 | jq '.'

# Helps validate understanding
# Shows what got captured
```

---

## 🔗 Resources

### Documentation
- **Full Docs**: https://docs.claude-mem.ai
- **GitHub**: https://github.com/chengjon/mem-claude
- **Issues**: https://github.com/chengjon/mem-claude/issues

### Testing & Validation
- **Test Report**: `COMPREHENSIVE_TEST_REPORT.md`
- **API Tests**: `API_TEST_REPORT.md`
- **API Guide**: `API_TESTING_GUIDE.md`

### Getting Help

```bash
# Built-in help
curl http://localhost:37777/api/search/help

# Check version
npm run worker:version

# View logs
tail -f ~/.claude-mem/logs/worker-service.log

# Run diagnostics
npm run worker:doctor
```

---

## 🎉 You're Ready!

**Start using Claude Code normally - Claude-Mem will learn from everything you do.**

```bash
# Your first session starts now
# Work, learn, and let Claude-Mem remember it all

# Next time you return:
# "Where did I put that authentication logic?"
# → Claude-Mem already knows!
```

**Happy coding!** 🚀

---

## 🆘 Quick Commands Reference

```bash
# Worker Management
npm run worker:start      # Start worker
npm run worker:stop       # Stop worker
npm run worker:restart    # Restart worker
npm run worker:status     # Check status
npm run worker:logs       # View logs

# Database Management
ls -la ~/.claude-mem/claude-mem.db    # View database
cp ~/.claude-mem/claude-mem.db ~/.claude-mem/backup.db  # Backup

# Health Checks
curl http://localhost:37777/health           # Health status
curl http://localhost:37777/api/readiness    # Readiness check
curl http://localhost:37777/api/stats | jq '.'  # Statistics

# Quick Searches
curl "http://localhost:37777/api/search?query=test" | jq '.'
curl "http://localhost:37777/api/decisions?limit=5" | jq '.'
curl "http://localhost:37777/api/context/recent" | jq '.'
```

---

**Version**: 7.4.5
**Last Updated**: December 25, 2025
**License**: MIT
**Test Status**: ✅ Production Ready (98.7% test pass rate)
