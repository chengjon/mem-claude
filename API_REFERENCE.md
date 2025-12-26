# Claude-Mem API Reference

## Overview

Claude-Mem provides a comprehensive HTTP API for searching and managing persistent AI memory across coding sessions.

**Base URL:** `http://localhost:37777` (configurable via settings)

**Version:** 7.4.6

**Database:** SQLite + FTS5 full-text search at `~/.mem-claude/mem-claude.db`

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Search Endpoints](#search-endpoints)
3. [Context Endpoints](#context-endpoints)
4. [Data Retrieval](#data-retrieval)
5. [Response Format](#response-format)
6. [Performance](#performance)
7. [Security](#security)
8. [Error Handling](#error-handling)

---

## Quick Start

### Health Check

```bash
curl http://localhost:37777/health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-12-25T10:30:00.000Z",
  "uptime": "2h 15m"
}
```

### Check Readiness

```bash
curl http://localhost:37777/api/readiness
```

**Response:**
```json
{
  "status": "ready",
  "mcpReady": true,
  "chromaReady": true
}
```

### Statistics

```bash
curl http://localhost:37777/api/stats | jq '.'
```

---

## Search Endpoints

### Unified Search

Search across observations, sessions, and prompts.

```bash
curl "http://localhost:37777/api/search?query=authentication" | jq '.'
```

**Parameters:**
- `query` (string, required) - Search query
- `limit` (number, optional) - Max results (default: 20)
- `project` (string, optional) - Filter by project name
- `offset` (number, optional) - Skip N results for pagination

### Semantic Shortcuts

Quick access to pre-configured semantic searches:

```bash
# Find decisions
curl "http://localhost:37777/api/decisions?limit=10" | jq '.'

# Find changes
curl "http://localhost:37777/api/changes?limit=10" | jq '.'

# Find how-it-works explanations
curl "http://localhost:37777/api/how-it-works?limit=10" | jq '.'
```

### Specific Type Searches

#### By Concept

Search observations tagged with specific concepts:

```bash
curl "http://localhost:37777/api/search/by-concept?concept=bugfix&limit=10" | jq '.'
```

#### By File

Search observations related to a specific file:

```bash
curl "http://localhost:37777/api/search/by-file?filePath=Database.ts&limit=10" | jq '.'
```

#### By Type

Search observations by type:

```bash
curl "http://localhost:37777/api/search/by-type?type=feature&limit=10" | jq '.'
```

**Available Types:** `decision`, `bugfix`, `feature`, `refactor`, `discovery`

### Timeline Search

Get chronological context around a query:

```bash
curl "http://localhost:37777/api/timeline?query=rate%20limiting" | jq '.'
```

**Parameters:**
- `query` (string, optional) - Search query
- `anchor` (number, optional) - Observation ID to center timeline around
- `depth_before` (number, optional) - Records before anchor (default: 10)
- `depth_after` (number, optional) - Records after anchor (default: 10)
- `mode` (string, optional) - Timeline mode: `compact`, `verbose`, `auto` (default: `auto`)

---

## Context Endpoints

### Recent Context

Get recent session context for context injection:

```bash
curl "http://localhost:37777/api/context/recent?limit=3" | jq '.'
```

### Context Timeline

Get timeline around a specific observation:

```bash
curl "http://localhost:37777/api/context/timeline?anchor=123&depth_before=10&depth_after=10" | jq '.'
```

### Context Preview

Generate context preview for a project:

```bash
curl "http://localhost:37777/api/context/preview?project=mem-claude" | jq '.'
```

### Context Injection

Get formatted context for session injection:

```bash
curl "http://localhost:37777/api/context/inject?project=mem-claude&colors=true" | jq '.'
```

**Parameters:**
- `project` (string, optional) - Project name
- `colors` (boolean, optional) - Include ANSI color codes
- `limit` (number, optional) - Max observations (default: 50)

---

## Data Retrieval

### List Endpoints

```bash
# Get observations
curl "http://localhost:37777/api/observations?limit=10" | jq '.'

# Get session summaries
curl "http://localhost:37777/api/summaries?limit=10" | jq '.'

# Get user prompts
curl "http://localhost:37777/api/prompts?limit=10" | jq '.'

# Get AI responses
curl "http://localhost:37777/api/ai-responses?limit=10" | jq '.'

# Get tool executions
curl "http://localhost:37777/api/tool-executions?limit=10" | jq '.'

# Get projects list
curl "http://localhost:37777/api/projects" | jq '.'
```

### Get by ID

```bash
# Get specific observation
curl "http://localhost:37777/api/observation/123" | jq '.'

# Get specific session summary
curl "http://localhost:37777/api/summary/123" | jq '.'

# Get specific user prompt
curl "http://localhost:37777/api/prompt/123" | jq '.'
```

---

## Response Format

All API responses follow a consistent structure:

### Success Response

```json
{
  "content": [
    {
      "type": "text",
      "text": "Response data..."
    }
  ],
  "isError": false
}
```

### Table Response

```json
{
  "content": [
    {
      "type": "text",
      "text": "┌────┬──────────┬─────────┐\n│ ID │ Type     │ Title   │\n├────┼──────────┼─────────┤\n..."
    }
  ],
  "isError": false
}
```

### Error Response

```json
{
  "content": [
    {
      "type": "text",
      "text": "Error: Must provide either \"anchor\" or \"query\" parameter"
    }
  ],
  "isError": true
}
```

---

## Performance

### Benchmarks (v7.4.6)

| Operation | Avg Response | P95 | P99 |
|-----------|--------------|-----|-----|
| Simple GET | 9-13ms | 15ms | 25ms |
| Complex Query | 28ms | 45ms | 80ms |
| Timeline Search | 35ms | 60ms | 100ms |
| Semantic Search | 50ms | 90ms | 150ms |

### Optimization Features

**Database Indexes (28 total):**
- Primary key indexes on all tables
- Composite indexes on (project, created_at_epoch)
- FTS5 full-text search indexes

**Query Optimizations:**
- Set-based lookups (O(1) vs O(n))
- Automatic query plan caching
- Connection pooling

**Concurrency:**
- Handles 50+ parallel requests
- Rate limiting: 100 req/min (configurable)
- Localhost bypass for rate limits

### Performance Tips

1. **Use specific endpoints** - `/api/decisions` is faster than `/api/search?query=decisions`
2. **Set reasonable limits** - Default 20 is optimal for most use cases
3. **Filter by project** - Reduces search space significantly
4. **Use FTS5 queries** - Full-text search is faster than LIKE queries

---

## Security

### Current Configuration

- **CORS:** Enabled for all origins (`Access-Control-Allow-Origin: *`)
- **Rate Limiting:** 100 req/min, bypassed for localhost
- **Input Validation:** SQL injection protection, XSS protection
- **Authentication:** None (localhost only)

### Production Recommendations

1. **Restrict CORS:**
   ```javascript
   Access-Control-Allow-Origin: https://yourdomain.com
   ```

2. **Add Security Headers:**
   ```
   X-Frame-Options: DENY
   X-Content-Type-Options: nosniff
   Content-Security-Policy: default-src 'self'
   ```

3. **Enable Rate Limiting:**
   ```javascript
   // Remove localhost bypass in production
   rateLimit({ windowMs: 60000, max: 100 })
   ```

4. **Add Authentication:**
   - API keys for remote access
   - JWT tokens for web UI

---

## Error Handling

### Error Response Format

All errors return HTTP 200 with JSON body containing `isError: true`:

```json
{
  "content": [{
    "type": "text",
    "text": "Error: Invalid query parameter"
  }],
  "isError": true
}
```

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| Missing required parameter | Query parameter not provided | Check API documentation for required params |
| Invalid query syntax | Malformed search query | Escape special characters |
| Database connection issues | Worker not running | Check worker process: `ps aux \| grep worker` |
| Resource not found | ID doesn't exist | Verify ID exists in database |
| Rate limit exceeded | Too many requests | Wait or increase rate limit |

### Troubleshooting

```bash
# Check if worker is running
curl http://localhost:37777/health

# Check worker process
ps aux | grep worker-service

# Check logs
tail -f ~/.mem-claude/worker.log

# Verify database has data
curl http://localhost:37777/api/stats | jq '.'

# Test database connection
sqlite3 ~/.mem-claude/mem-claude.db "SELECT COUNT(*) FROM observations;"
```

---

## Advanced Usage

### Search Filters

```bash
# Filter by type
curl "http://localhost:37777/api/search?query=test&filters.type=observation" | jq '.'

# Filter by project
curl "http://localhost:37777/api/search?query=api&filters.project=mem-claude" | jq '.'
```

### Timeline by Query

```bash
# Search and get timeline context
curl "http://localhost:37777/api/timeline/by-query?query=database&mode=compact" | jq '.'
```

### Batch Operations

```bash
# Get multiple observations by IDs
curl "http://localhost:37777/api/observations/batch?ids=1,2,3,4,5" | jq '.'
```

---

## Database Schema

### Tables

**observations:**
- `id` (INTEGER PRIMARY KEY)
- `sdk_session_id` (TEXT)
- `project` (TEXT)
- `title` (TEXT)
- `subtitle` (TEXT)
- `narrative` (TEXT)
- `text` (TEXT)
- `type` (TEXT) - decision, bugfix, feature, refactor, discovery
- `concepts` (TEXT) - JSON array of concepts
- `files_touched` (TEXT) - JSON array of file paths
- `facts` (TEXT) - JSON array of facts
- `created_at_epoch` (INTEGER)
- `discovery_tokens` (INTEGER)

**session_summaries:**
- `id` (INTEGER PRIMARY KEY)
- `sdk_session_id` (TEXT UNIQUE)
- `project` (TEXT)
- `request` (TEXT)
- `investigated` (TEXT)
- `learned` (TEXT)
- `completed` (TEXT)
- `next_steps` (TEXT)
- `files_read` (TEXT) - JSON array
- `files_edited` (TEXT) - JSON array
- `notes` (TEXT)
- `created_at_epoch` (INTEGER)
- `discovery_tokens` (INTEGER)

**user_prompts:**
- `id` (INTEGER PRIMARY KEY)
- `claude_session_id` (TEXT)
- `project` (TEXT)
- `prompt` (TEXT)
- `created_at_epoch` (INTEGER)

### FTS5 Virtual Tables

**observations_fts:** Full-text search on title, subtitle, narrative, text, facts, concepts

**session_summaries_fts:** Full-text search on request, investigated, learned, completed, next_steps, notes

### Indexes (28 total)

All major query patterns have indexes:
- Primary key indexes
- `created_at_epoch DESC` for timeline queries
- `project` for project filtering
- `type` for type filtering
- Composite `(project, created_at_epoch)` for combined queries

---

## API Versioning

The API is versioned via the worker service version. Current version: **7.4.6**

Breaking changes are rare and documented in:
- CHANGELOG.md
- GitHub releases

---

## Related Documentation

- [Testing Guide](API_TESTING_GUIDE.md) - Comprehensive testing examples
- [Performance Analysis](PERFORMANCE_ANALYSIS.md) - Detailed performance analysis
- [Database Access Guide](DATABASE_ACCESS_GUIDE.md) - Database internals
- [Troubleshooting Skill](plugin/skills/troubleshoot/SKILL.md) - Interactive troubleshooting

---

## Support

For issues and questions:
- GitHub Issues: https://github.com/chengjon/mem-claude/issues
- Troubleshooting: Run `/mem-search help` in Claude Code
- Logs: `~/.mem-claude/worker.log`

---

**Last Updated:** 2025-12-25
**API Version:** 7.4.6
