# Pending Dependency Updates - Major Version Releases

## Overview

This document tracks major version updates that require careful testing and migration planning.

**Last Updated**: December 25, 2025
**Current Status**: 8 major updates pending

---

## Safe Updates Completed ✅

- `@anthropic-ai/claude-agent-sdk`: 0.1.75 → 0.1.76 (patch)
- `esbuild`: 0.25.12 → 0.27.2 (minor)

---

## Pending Major Updates

### 1. Express 5.0 (High Priority)

**Current**: 4.22.1
**Latest**: 5.2.1
**Type**: Major version release
**Breaking Changes**: Yes
**Risk**: HIGH

**Impact**:
- Express 5.0 removes several deprecated methods
- Changes to error handling middleware
- `app.del()` removed (use `app.delete()`)
- `res.send(status)` removed (use `res.status(status).send()`)
- `res.json(status)` removed (use `res.status(status).json()`)
- Body parser integration changes
- URL-encoded parsing changes

**Dependencies**:
- `@types/express`: 4.17.25 → 5.0.6

**Migration Guide**: https://expressjs.com/en/guide/migrating-5.html

**Testing Required**:
- All API endpoints (23 endpoints)
- Middleware chain (security, CORS, rate limiting, logging)
- Error handling
- Static file serving
- Request/response parsing

---

### 2. React 19 (Medium Priority)

**Current**: 18.3.1
**Latest**: 19.2.3
**Type**: Major version release
**Breaking Changes**: Yes
**Risk**: MEDIUM

**Impact**:
- New JSX Transform behavior
- Concurrent rendering changes
- Suspense improvements
- Actions API changes
- useTransition hook changes
- Server Components support (if applicable)

**Dependencies**:
- `react-dom`: 18.3.1 → 19.2.3
- `@types/react`: 18.3.27 → 19.2.7
- `@types/react-dom`: 18.3.7 → 19.2.3

**Files Affected**:
- `src/ui/viewer/App.tsx`
- `src/ui/viewer/components/*.tsx`

**Testing Required**:
- Viewer UI functionality
- TerminalPreview component
- All React hooks
- State management
- Event handlers

---

### 3. Node.js Types 25 (Low Priority)

**Current**: 20.19.27
**Latest**: 25.0.3
**Type**: Major version release
**Breaking Changes**: Possible
**Risk**: LOW

**Impact**:
- New Node.js 25 APIs added
- Type definitions may change
- Project engine is Node 18+, so Node 25 types might include APIs not available

**Recommendation**: Keep at 20.x until project engine requirement is updated to Node 25

---

### 4. Glob 13 (Low Priority)

**Current**: 11.1.0
**Latest**: 13.0.0
**Type**: Major version release
**Breaking Changes**: Yes
**Risk**: LOW

**Impact**:
- API changes to glob patterns
- Performance improvements
- Changes to async iteration

**Files Affected**:
- Any files using `glob` package

**Testing Required**:
- Build scripts
- File watching
- Pattern matching

---

## Migration Strategy

### Phase 1: Express 5 Update (Recommended First)

**Why First**: Express is the most critical dependency for the HTTP API

**Steps**:
1. Create feature branch: `git checkout -b upgrade/express-5`
2. Update Express in package.json
3. Review breaking changes list
4. Update middleware for Express 5
5. Test all API endpoints
6. Run full test suite
7. Manual testing of worker service
8. Deploy to staging for validation
9. Create PR with testing checklist

**Rollback Plan**: Keep Express 4.x working, revert if critical issues found

---

### Phase 2: React 19 Update

**Why Second**: Viewer UI is important but less critical than API

**Steps**:
1. Create feature branch: `git checkout -b upgrade/react-19`
2. Update React and ReactDOM
3. Update type definitions
4. Fix any TypeScript errors
5. Test all UI components
6. Verify viewer functionality
7. Check for console warnings
8. Deploy and validate
9. Create PR

**Rollback Plan**: Build process creates static assets, easy to revert

---

### Phase 3: Remaining Updates

Update Node.js types and glob after Express and React are stable

---

## Testing Checklist

For each major update:

- [ ] Run `npm run build` - ensure build succeeds
- [ ] Run `npm test` - all tests pass
- [ ] Start worker: `npm run worker:start`
- [ ] Test health endpoint: `curl http://localhost:37777/health`
- [ ] Test API endpoints (use API_TESTING_GUIDE.md)
- [ ] Test viewer UI at http://localhost:37777
- [ ] Check for console warnings/errors
- [ ] Review logs: `npm run worker:logs`
- [ ] Test MCP integration (if applicable)
- [ ] Load test with concurrent requests
- [ ] Memory leak check
- [ ] Performance regression check

---

## Risk Mitigation

1. **Feature Flags**: Consider adding feature flags for major changes
2. **Canary Deployment**: Deploy to subset of users first
3. **Monitoring**: Add metrics for error rates, response times
4. **Rollback**: Keep previous version tags for quick revert
5. **Testing**: Comprehensive test coverage before merge

---

## Timeline Estimate

- Express 5: 2-3 days (including testing)
- React 19: 1-2 days (including testing)
- Node types + glob: 0.5 day

**Total**: 3.5-5.5 days for all updates

---

## Dependencies Between Updates

- Express 5 update: Independent
- React 19 update: Independent
- Node types 25: Should wait for Node 25 engine requirement
- Glob 13: Independent

**Recommendation**: Start with Express 5, then React 19

---

## Notes

- All updates should be done in separate PRs for easier review
- Each update should have its own feature branch
- Keep changelog of breaking changes encountered
- Document any workarounds needed
- Update this document after each update is completed

---

## References

- Express 5 Migration: https://expressjs.com/en/guide/migrating-5.html
- React 19 Upgrade Guide: https://react.dev/blog/2024/12/05/react-19
- Node 25 Release Notes: https://nodejs.org/en/blog/release/v25.0.0
- Glob Changelog: https://github.com/isaacs/node-glob/blob/main/changelog.md
