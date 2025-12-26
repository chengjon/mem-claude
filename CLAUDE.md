/* To @claude: be vigilant about only leaving evergreen context in this file, mem-claude handles working context separately. */

# Claude-Mem: AI Development Instructions

## What This Project Is

Claude-mem is a Claude Code plugin providing persistent memory across sessions. It captures tool usage, compresses observations using the Claude Agent SDK, and injects relevant context into future sessions.

## Architecture

**5 Lifecycle Hooks**: SessionStart → UserPromptSubmit → PostToolUse → Summary → SessionEnd

**Hooks** (`src/hooks/*.ts`) - TypeScript → ESM, built to `plugin/scripts/*-hook.js`

**Worker Service** (`src/services/worker-service.ts`) - Express API on port 37777, Bun-managed, handles AI processing asynchronously

**Database** (`src/services/sqlite/`) - SQLite3 at `~/.mem-claude/mem-claude.db` with FTS5 full-text search

**Search Skill** (`plugin/skills/mem-search/SKILL.md`) - HTTP API for searching past work, auto-invoked when users ask about history

**Chroma** (`src/services/sync/ChromaSync.ts`) - Vector embeddings for semantic search

**Viewer UI** (`src/ui/viewer/`) - React interface at http://localhost:37777, built to `plugin/ui/viewer.html`

## Privacy Tags

**Dual-Tag System** for meta-observation control:
- `<private>content</private>` - User-level privacy control (manual, prevents storage)
- `<mem-claude-context>content</mem-claude-context>` - System-level tag (auto-injected observations, prevents recursive storage)

**Implementation**: Tag stripping happens at hook layer (edge processing) before data reaches worker/database. See `src/utils/tag-stripping.ts` for shared utilities.

## Build Commands

```bash
npm run build-and-sync        # Build, sync to marketplace, restart worker
```

**Viewer UI**: http://localhost:37777

## Configuration

Settings are managed in `~/.mem-claude/settings.json`. The file is auto-created with defaults on first run.

**Core Settings:**
- `CLAUDE_MEM_MODEL` - Model for observations/summaries (default: claude-sonnet-4-5)
- `CLAUDE_MEM_CONTEXT_OBSERVATIONS` - Observations injected at SessionStart
- `CLAUDE_MEM_WORKER_PORT` - Worker service port (default: 37777)
- `CLAUDE_MEM_WORKER_HOST` - Worker bind address (default: 127.0.0.1, use 0.0.0.0 for remote access)

**System Configuration:**
- `CLAUDE_MEM_DATA_DIR` - Data directory location (default: ~/.mem-claude)
- `CLAUDE_MEM_LOG_LEVEL` - Log verbosity: DEBUG, INFO, WARN, ERROR, SILENT (default: INFO)

## File Locations

- **Source**: `<project-root>/src/`
- **Built Plugin**: `<project-root>/plugin/`
- **Installed Plugin**: `~/.claude/plugins/marketplaces/chengjon/`
- **Database**: `~/.mem-claude/mem-claude.db`
- **Chroma**: `~/.mem-claude/chroma/`

## Requirements

- **Bun** (all platforms - auto-installed if missing)
- **uv** (all platforms - auto-installed if missing, provides Python for Chroma)
- Node.js (build tools only)

## Documentation

**Public Docs**: https://docs.mem-claude.ai (Mintlify)
**Source**: `docs/public/` - MDX files, edit `docs.json` for navigation
**Deploy**: Auto-deploys from GitHub on push to main

## Pro Features Architecture

Claude-mem is designed with a clean separation between open-source core functionality and optional Pro features.

**Open-Source Core** (this repository):

- All worker API endpoints on localhost:37777 remain fully open and accessible
- Pro features are headless - no proprietary UI elements in this codebase
- Pro integration points are minimal: settings for license keys, tunnel provisioning logic
- The architecture ensures Pro features extend rather than replace core functionality

**Pro Features** (coming soon, external):

- Enhanced UI (Memory Stream) connects to the same localhost:37777 endpoints as the open viewer
- Additional features like advanced filtering, timeline scrubbing, and search tools
- Access gated by license validation, not by modifying core endpoints
- Users without Pro licenses continue using the full open-source viewer UI without limitation

This architecture preserves the open-source nature of the project while enabling sustainable development through optional paid features.

## Working Guidelines

**CRITICAL: Always Fix Problems at the Source Code Level**

When encountering issues with the installed plugin, follow these rules:

### ✅ DO:
- **Modify source code in this repository** - Fix problems in `src/`, `scripts/`, `plugin/.claude-plugin/`, etc.
- **Update build/sync scripts** - Ensure `scripts/sync-marketplace.cjs` correctly handles installation
- **Test fixes locally** - Use `npm run build-and-sync` to verify fixes work
- **Commit changes to Git** - Push fixes to GitHub so others benefit
- **Think about future installations** - Ensure fixes work for new users installing from GitHub

### ❌ DON'T:
- **Directly modify installed files** - Never edit files in `~/.claude/plugins/` directly
- **Fix only the local installation** - Manual fixes to installed plugins won't persist
- **Ignore the root cause** - If installation process has a bug, fix the script, not the result
- **Make one-off changes** - Every fix should be in source code for the next release

### Rationale

When you fix problems by modifying installed files:
- ❌ Fixes are lost when users run `npm run build-and-sync`
- ❌ New installations from GitHub will still have the same bugs
- ❌ Other users don't benefit from your fixes
- ❌ No audit trail of what was changed and why

When you fix problems by modifying source code:
- ✅ Fixes persist through rebuilds and reinstallation
- ✅ All users benefit when they pull from GitHub
- ✅ Changes are tracked in Git history
- ✅ Installation process improves over time

### Example

**Wrong approach:**
```bash
# Directly editing installed plugin configuration
vim ~/.claude/plugins/installed_plugins.json
# This fix will be lost on next sync!
```

**Correct approach:**
```bash
# Edit the sync script to properly update configuration
vim scripts/sync-marketplace.cjs
# Test, commit, and push to GitHub
npm run build-and-sync
git add scripts/sync-marketplace.cjs
git commit -m "fix: Update installed_plugins.json during sync"
git push
```

# Important

No need to edit the changelog ever, it's generated automatically.
