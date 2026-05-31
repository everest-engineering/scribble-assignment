# Quickstart: Validate Game Start & Drawer Flow

**Feature**: `002-game-start-drawer`  
**Prerequisites**: Scenario 1 working; backend `:3001`, frontend `:5173`

## Setup

```bash
cd backend && npm run dev
cd frontend && npm run dev
```

## Manual test checklist

### 1. Name validation

| Action | Expected |
|--------|----------|
| Create room with empty name | Error: "Player name is required" |
| Join with `"   "` name | Same error |
| Create with `"  Alex  "` | Lobby shows `Alex` |

### 2. Drawer assignment

1. Tab A (host): create as `Host` with valid name.
2. Tab B: join as `Guest`.
3. Host starts game → both on game screen.
4. Both tabs show host/`Host` as the drawer (label or role indicator).

### 3. Secret word visibility

1. On drawer tab (host): secret word visible (e.g., in Word card).
2. On guesser tab: word hidden — no secret in UI.
3. Open devtools → Network → poll `GET /rooms/:code?participantId=...` on guesser tab → response JSON must **not** contain `secretWord`.

### 4. Deterministic word

1. Note room code and secret word shown to drawer.
2. Restart backend (clears rooms), recreate **same code is random** — instead: record code `XXXX` and word `W1`.
3. In Vitest or by repeating create+start in tests: same code → same word (see `wordSelection.test.ts`).

For manual spot-check: use backend test or create room, note code, restart server, recreate until same code (optional) — automated test is authoritative.

### 5. Scores at start

- Scoreboard shows `0` for all participants on both tabs.

### 6. Route guard

- Open `/game` without starting → redirect to lobby or home per implementation.

### 7. Builds

```bash
cd backend && npm run build && npm test
cd frontend && npm run build
```

## Regression (Scenario 1)

- Lobby polling, host-only start, join validation, auto-navigate to game still work.
