# Quick Commands Reference

Essential commands for troubleshooting mem-claude.

## Worker Management

```bash
# Check worker status
cd ~/.claude/plugins/marketplaces/chengjon/
npm run worker:status

# Start worker
npm run worker:start

# Restart worker
mem-claude restart

# Stop worker
npm run worker:stop

# View logs
npm run worker:logs

# View today's log file
cat ~/.mem-claude/logs/worker-$(date +%Y-%m-%d).log

# Last 50 lines
tail -50 ~/.mem-claude/logs/worker-$(date +%Y-%m-%d).log

# Follow logs in real-time
tail -f ~/.mem-claude/logs/worker-$(date +%Y-%m-%d).log
```

## Health Checks

```bash
# Check worker health (default port)
curl -s http://127.0.0.1:37777/health

# Check viewer stats
curl -s http://127.0.0.1:37777/api/stats

# Open viewer in browser
open http://127.0.0.1:37777

# Test custom port
PORT=37778
curl -s http://127.0.0.1:$PORT/health
```

## Database Queries

```bash
# Observation count
sqlite3 ~/.mem-claude/mem-claude.db "SELECT COUNT(*) FROM observations;"

# Session count
sqlite3 ~/.mem-claude/mem-claude.db "SELECT COUNT(*) FROM sessions;"

# Recent observations
sqlite3 ~/.mem-claude/mem-claude.db "SELECT created_at, type, title FROM observations ORDER BY created_at DESC LIMIT 10;"

# Recent sessions
sqlite3 ~/.mem-claude/mem-claude.db "SELECT created_at, request FROM sessions ORDER BY created_at DESC LIMIT 5;"

# Database size
du -h ~/.mem-claude/mem-claude.db

# Database integrity check
sqlite3 ~/.mem-claude/mem-claude.db "PRAGMA integrity_check;"

# Projects in database
sqlite3 ~/.mem-claude/mem-claude.db "SELECT DISTINCT project FROM observations ORDER BY project;"
```

## Configuration

```bash
# View current settings
cat ~/.mem-claude/settings.json
cat ~/.claude/settings.json

# Change worker port
echo '{"CLAUDE_MEM_WORKER_PORT":"37778"}' > ~/.mem-claude/settings.json

# Change context observation count
# Edit ~/.mem-claude/settings.json and add:
{
  "CLAUDE_MEM_CONTEXT_OBSERVATIONS": "25"
}

# Change AI model
{
  "CLAUDE_MEM_MODEL": "claude-sonnet-4-5"
}
```

## Plugin Management

```bash
# Navigate to plugin directory
cd ~/.claude/plugins/marketplaces/chengjon/

# Check plugin version
grep '"version"' package.json

# Reinstall dependencies
npm install

# View package.json
cat package.json
```

## Port Diagnostics

```bash
# Check what's using port 37777
lsof -i :37777
netstat -tlnp | grep 37777

# Test port connectivity
nc -zv 127.0.0.1 37777
curl -v http://127.0.0.1:37777/health
```

## Log Analysis

```bash
# Search logs for errors
grep -i "error" ~/.mem-claude/logs/worker-$(date +%Y-%m-%d).log

# Search for specific keyword
grep "keyword" ~/.mem-claude/logs/worker-$(date +%Y-%m-%d).log

# Search across all log files
grep -i "error" ~/.mem-claude/logs/worker-*.log

# Last 100 error lines
grep -i "error" ~/.mem-claude/logs/worker-$(date +%Y-%m-%d).log | tail -100

# Follow logs in real-time
tail -f ~/.mem-claude/logs/worker-$(date +%Y-%m-%d).log
```

## File Locations

```bash
# Plugin directory
~/.claude/plugins/marketplaces/chengjon/

# Database
~/.mem-claude/mem-claude.db

# Settings
~/.mem-claude/settings.json
~/.claude/settings.json

# Chroma vector database
~/.mem-claude/chroma/

# Worker logs (daily rotation)
~/.mem-claude/logs/worker-*.log

# Worker PID file
~/.mem-claude/worker.pid
```

## System Information

```bash
# OS version
uname -a

# Node version
node --version

# NPM version
npm --version

# Bun version
bun --version

# SQLite version
sqlite3 --version

# Check disk space
df -h ~/.mem-claude/
```

## One-Line Diagnostics

```bash
# Full worker status check
npm run worker:status && curl -s http://127.0.0.1:37777/health

# Quick health check
curl -s http://127.0.0.1:37777/health && echo " - Worker is healthy"

# Database stats
echo "Observations: $(sqlite3 ~/.mem-claude/mem-claude.db 'SELECT COUNT(*) FROM observations;')" && echo "Sessions: $(sqlite3 ~/.mem-claude/mem-claude.db 'SELECT COUNT(*) FROM sessions;')"

# Recent errors
grep -i "error" ~/.mem-claude/logs/worker-$(date +%Y-%m-%d).log | tail -10

# Port check
lsof -i :37777 || echo "Port 37777 is free"
```
