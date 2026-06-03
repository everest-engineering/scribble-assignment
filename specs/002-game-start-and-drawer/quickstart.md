# Quickstart: Game Start and Drawer Validation

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

## Two-tab manual scenario

### Tab A — Host (drawer)

1. Create room as `Alice`; note code
2. Tab B joins as `Bob`
3. Wait for lobby poll — both see 2 players
4. Alice clicks **Start Game** → lands on game page
5. Alice sees **word card** with deterministic word (e.g. for code sum mod 5)
6. Network: `GET /rooms/:code?participantId=` shows `secretWord` non-null, `viewer.isDrawer: true`

### Tab B — Guesser

1. After Alice starts, within ~3 s poll shows `status: "playing"` (or navigate to game if still on lobby after refresh)
2. Bob sees **hint card** only — no secret word text
3. Network: same endpoint with Bob's `participantId` shows `secretWord: null`, `viewer.isDrawer: false`

### Rejection cases

| Action | Expected |
|--------|----------|
| Start with 1 player | 409 / disabled UI |
| Non-host POST start | 403 |
| Second start while playing | 409 |
| Unknown code start | 404 |

## Determinism check

For a known room code, compute `sumCharCodes(code) % 5` and confirm drawer (Alice) always sees the same starter word on repeated fresh rooms with that code pattern (optional: log code from UI).
