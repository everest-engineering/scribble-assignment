# Quickstart: Result and Restart Validation

## Prerequisites

```bash
cd backend && npm install && npm run dev
cd frontend && npm install && npm run dev
```

## Automated checks

```bash
cd backend && npm test && npm run build
cd frontend && npm test && npm run build
node .github/scripts/pre-evaluation-check.mjs
```

## Two-tab manual scenario (full lab)

### Scenarios 1–2 setup

1. Tab A (Alice): create room; Tab B (Bob): join
2. Alice starts game — both on game page

### Scenario 3 gameplay

3. Alice draws; Bob sees strokes within ~3 s
4. Bob submits wrong guess — history visible both tabs
5. Bob submits correct guess — Bob +100, status **result**

### Scenario 4 result

6. **Both tabs** show revealed word (not just Alice)
7. Both tabs show final scores and full guess history
8. Bob tab: no **Play Again** (or disabled with host-only message)
9. Draw and guess controls disabled

### Scenario 4 restart

10. Alice clicks **Play Again** — navigates to lobby
11. Bob tab auto-redirects to lobby within ~3 s (poll)
12. Both tabs: same two players, Ready to play, no round data
13. Alice starts again — scores 0, Alice drawer, new word

### Precheck

```bash
node .github/scripts/pre-evaluation-check.mjs
```

Verify `reflection.md` exists at repo root (≥500 chars).
