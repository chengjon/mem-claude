# Claude-Mem Worker API - Quick Testing Guide

## Overview

The Claude-Mem Worker Service provides a comprehensive HTTP API for searching and managing persistent AI memory. This guide provides quick reference for common API operations and testing patterns.

## Base Configuration

```
Base URL: http://localhost:37777
Port: 37777
Version: 7.4.5
Database: ~/.mem-claude/mem-claude.db
```

## Quick Start

### 1. Health Check
```bash
curl http://localhost:37777/health
# Expected: {"status":"ok","timestamp":...}
```

### 2. Check Readiness
```bash
curl http://localhost:37777/api/readiness
# Expected: {"status":"ready","mcpReady":true}
```

### 3. View Statistics
```bash
curl http://localhost:37777/api/stats | jq '.'
```

---

## Search Endpoints

### Unified Search (All Types)
```bash
# Search observations, sessions, and prompts
curl "http://localhost:37777/api/search?query=authentication" | jq '.'
```

### Timeline Search
```bash
# Get timeline context for a query
curl "http://localhost:37777/api/timeline?query=rate%20limiting" | jq '.'
```

### Semantic Shortcuts
```bash
# Find decisions
curl "http://localhost:37777/api/decisions?limit=10" | jq '.'

# Find changes
curl "http://localhost:37777/api/changes?limit=10" | jq '.'

# Find how-it-works explanations
curl "http://localhost:37777/api/how-it-works?limit=10" | jq '.'
```

### Specific Type Searches
```bash
# Search observations only
curl "http://localhost:37777/api/search/observations?query=test&limit=5" | jq '.'

# Search sessions
curl "http://localhost:37777/api/search/sessions?query=api&limit=5" | jq '.'

# Search prompts
curl "http://localhost:37777/api/search/prompts?query=database&limit=5" | jq '.'

# Search by concept
curl "http://localhost:37777/api/search/by-concept?concept=bugfix&limit=10" | jq '.'

# Search by file
curl "http://localhost:37777/api/search/by-file?filePath=Database.ts&limit=10" | jq '.'

# Search by type
curl "http://localhost:37777/api/search/by-type?type=feature&limit=10" | jq '.'
```

---

## Context Endpoints

### Recent Context
```bash
# Get recent session context
curl "http://localhost:37777/api/context/recent?limit=3" | jq '.'
```

### Context Timeline
```bash
# Get timeline around an anchor
curl "http://localhost:37777/api/context/timeline?anchor=123&depth_before=10&depth_after=10" | jq '.'
```

### Context Preview
```bash
# Generate context preview for a project
curl "http://localhost:37777/api/context/preview?project=mem-claude"
```

---

## Data Retrieval Endpoints

### List Data
```bash
# Get observations
curl "http://localhost:37777/api/observations?limit=10" | jq '.'

# Get summaries
curl "http://localhost:37777/api/summaries?limit=10" | jq '.'

# Get prompts
curl "http://localhost:37777/api/prompts?limit=10" | jq '.'

# Get AI responses
curl "http://localhost:37777/api/ai-responses?limit=10" | jq '.'

# Get tool executions
curl "http://localhost:37777/api/tool-executions?limit=10" | jq '.'

# Get projects
curl "http://localhost:37777/api/projects" | jq '.'
```

### Get by ID
```bash
# Get specific observation
curl "http://localhost:37777/api/observation/123" | jq '.'

# Get specific session
curl "http://localhost:37777/api/session/123" | jq '.'

# Get specific prompt
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

### Error Response
```json
{
  "content": [
    {
      "type": "text",
      "text": "Error: Message describing what went wrong"
    }
  ],
  "isError": true
}
```

---

## Common Query Parameters

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| query | string | Search query | `query=authentication` |
| limit | number | Max results (default: 20) | `limit=10` |
| offset | number | Skip N results | `offset=20` |
| project | string | Filter by project | `project=mem-claude` |
| anchor | string | Timeline anchor point | `anchor=123` |
| depth_before | number | Records before anchor | `depth_before=10` |
| depth_after | number | Records after anchor | `depth_after=10` |

---

## Performance Expectations

Based on test results:

- **Simple GET**: 9-13ms (p95)
- **Complex Query**: 28ms average
- **Concurrent Handling**: 50+ parallel requests
- **Error Rate**: 0% (5xx), <1% (4xx)

---

## Security Notes

### Current Configuration
- CORS: Enabled for all origins (`Access-Control-Allow-Origin: *`)
- Rate Limiting: Enabled (100 req/min), bypassed for localhost
- Input Validation: Enabled (SQL injection, XSS protection)

### Recommendations for Production
1. Add security headers:
   - `X-Frame-Options: DENY`
   - `X-Content-Type-Options: nosniff`
   - `Content-Security-Policy: default-src 'self'`

2. Restrict CORS:
   ```javascript
   Access-Control-Allow-Origin: https://yourdomain.com
   ```

3. Enable rate limiting for non-localhost requests

---

## Error Handling

All errors return HTTP 200 with JSON body containing `isError: true`:

```json
{
  "content": [{
    "type": "text",
    "text": "Error: Must provide either \"anchor\" or \"query\" parameter"
  }],
  "isError": true
}
```

Common errors:
- Missing required parameters
- Invalid query syntax
- Database connection issues
- Resource not found

---

## Testing Examples

### Load Testing
```bash
# Sequential test (100 requests)
for i in {1..100}; do
  curl -s -o /dev/null -w "%{http_code} " http://localhost:37777/api/timeline
done
```

### Performance Test
```bash
# Measure response time
time curl -s http://localhost:37777/api/stats > /dev/null
```

### Concurrent Test
```bash
# 10 parallel requests
for i in {1..10}; do
  curl -s http://localhost:37777/api/timeline > /dev/null &
done
wait
```

---

## API Help

Get inline API documentation:
```bash
curl "http://localhost:37777/api/search/help" | jq '.'
```

---

## Database Schema Reference

Current database statistics:
- **Observations**: 137 records
- **Sessions**: 3 records
- **Summaries**: 6 records
- **Database Size**: 968 KB
- **Indexes**: 28 indexes across 5 tables

---

## Troubleshooting

### Connection Issues
```bash
# Check if worker is running
curl http://localhost:37777/health

# Check worker process
ps aux | grep worker-service

# Check logs
tail -f ~/.mem-claude/worker.log
```

### Empty Results
- Verify database has data: `curl http://localhost:37777/api/stats`
- Check query syntax
- Try broader search terms

### Slow Performance
- Check database size: `curl http://localhost:37777/api/stats`
- Verify indexes are intact (automatic validation)
- Consider reducing `limit` parameter

---

## Advanced Usage

### Search Filters
```bash
# Search with filters
curl "http://localhost:37777/api/search?query=test&filters.type=observation" | jq '.'
```

### Timeline by Query
```bash
# Search and get timeline context
curl "http://localhost:37777/api/timeline/by-query?query=database&mode=auto" | jq '.'
```

### Context Injection
```bash
# Get formatted context for injection
curl "http://localhost:37777/api/context/inject?project=mem-claude&colors=true"
```

---

## Files Referenced

- **Worker Service**: `/opt/iflow/mem-claude/src/services/worker-service.ts`
- **Search Routes**: `/opt/iflow/mem-claude/src/services/worker/http/routes/SearchRoutes.ts`
- **Database**: `/root/.mem-claude/mem-claude.db`
- **Settings**: `/root/.mem-claude/settings.json`

For complete implementation details, see:
- API Test Report: `/opt/iflow/mem-claude/API_TEST_REPORT.md`
- Source Code: `/opt/iflow/mem-claude/src/`
