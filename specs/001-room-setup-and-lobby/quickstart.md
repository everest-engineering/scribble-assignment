# Quickstart: Room Setup and Lobby Validation

## Prerequisites

```bash
cd backend && npm install && npm run dev
cd frontend && npm install && npm run dev
```

Backend: http://localhost:3001/health → `{ "ok": true }`  
Frontend: http://localhost:5173

## Automated checks

```bash
cd backend && npm test && npm run build
cd frontend && npm test && npm run build
node .github/scripts/pre-evaluation-check.mjs
```

## Two-tab manual scenario

### Tab A — Host

1. Open http://localhost:5173 → Create Room
2. Enter name `Alice` → submit
3. Note room code on lobby screen
4. Confirm Start is disabled with message about needing 2 players
5. Wait ~2 s after Tab B joins — Bob appears without clicking refresh

### Tab B — Joiner

1. Open http://localhost:5173 in incognito/second window → Join Room
2. Enter name `Bob` and Tab A's code → submit
3. Confirm both names listed
4. Confirm Start is disabled with host-only message

### Host start gating

1. In Tab A (Alice), confirm Start is enabled with 2 players
2. Click Start → navigates to `/game` placeholder (no round started on server)

### Validation edge cases

| Action | Expected |
|--------|----------|
| Create with blank name | Client error before request |
| Join with blank code | Client error before request |
| Join code `ZZZZ` | Server 404 message in form |
| Create second room | Different code and roster |
| Join 9th player to full room | 409 "Room is full" |

## Polling verification

1. Open browser devtools Network tab on lobby
2. Confirm `GET /rooms/:code` repeats ~every 2 s while tab visible
3. Switch tab away — requests pause
4. Switch back — polling resumes
