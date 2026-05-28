# Implementation Plan: Result, Restart & Final Validation

**Branch**: `assignment` | **Date**: 2026-05-28 | **Spec**: [spec.md](./spec.md)

---

## Summary

Add `POST /rooms/:code/end` (host-only, playing→result) and
`POST /rooms/:code/restart` (host-only, result→lobby with round state cleared).
New `/result` route shows correct word, scores, and guess history to all players.
Game screen polling auto-navigates to `/result`; result screen polling
auto-navigates back to `/lobby` on restart.

---

## Constitution Check

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Brownfield-First | ✅ Pass | Two new endpoints, one new page, no rewrites |
| II. Spec-Driven | ✅ Pass | Traces to FR-001–FR-007 |
| III. Deterministic Rules | ✅ Pass | State transitions are deterministic |
| IV. Strict Scope | ✅ Pass | No new libraries, no multi-round, no timer |
| V. Incremental Validation | ✅ Pass | Gate: full lobby→game→result→lobby loop in 2 tabs |
| VI. AI-Assisted, Human-Reviewed | ✅ Pass | Reviewed before commit |

---

## File-Level Changes

```
backend/
├── src/services/roomStore.ts   ← add endGame(), restartGame()
├── src/api/rooms.ts            ← add POST /:code/end and POST /:code/restart
└── src/api/schemas.ts          ← reuse startRoomSchema (participantId only)

frontend/
├── src/services/api.ts         ← add endRoom(), restartRoom()
├── src/state/roomStore.ts      ← add endRoom(), restartRoom() actions
├── src/pages/ResultPage.tsx    ← new: result screen with word, scores, history, restart
├── src/routes/index.tsx        ← add /result route
└── src/pages/GamePage.tsx      ← add auto-nav to /result when status === "result"
```

---

## API Contracts

```
POST /rooms/:code/end
Body:  { "participantId": "<uuid>" }
200:   { "room": { ...snapshot, status: "result" } }
400:   { "message": "Game is not in playing state" }
403:   { "message": "Only the host can end the game" }

POST /rooms/:code/restart
Body:  { "participantId": "<uuid>" }
200:   { "room": { ...snapshot, status: "lobby", guesses:[], scores:{} } }
400:   { "message": "Game is not in result state" }
403:   { "message": "Only the host can restart the game" }
```

---

## Data Flow

### End Round
```
Host clicks End Round on GamePage
  → POST /rooms/:code/end { participantId }
  → endGame(): validate host + playing status → status = "result"
  → host navigates to /result immediately
  → non-hosts: next game-screen poll detects "result" → navigate /result
```

### Restart
```
Host clicks Restart on ResultPage
  → POST /rooms/:code/restart { participantId }
  → restartGame(): validate host + result status
    → status = "lobby"; guesses=[]; scores={}; drawerId=undefined; secretWord=undefined
    → participants unchanged
  → host navigates to /lobby immediately
  → non-hosts: result-screen poll detects "lobby" → navigate /lobby
```

---

## Implementation Sequence

1. Backend: add `endGame()` and `restartGame()` to `roomStore.ts`
2. Backend: add `POST /:code/end` and `POST /:code/restart` to `rooms.ts`
3. Backend: extend tests for both new functions
4. Frontend: add `endRoom()` and `restartRoom()` to `api.ts` and `roomStore.ts`
5. Frontend: create `ResultPage.tsx` with polling + host restart button
6. Frontend: add `/result` route in `routes/index.tsx`
7. Frontend: update `GamePage.tsx` polling to auto-navigate on `status === "result"`
8. Frontend: add End Round button to `GamePage.tsx` for host
