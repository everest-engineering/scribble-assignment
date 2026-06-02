# Reflection Report

## Scribble — Multiplayer Drawing Game

### What did the starter app already have?

The starter scaffold provided a monolithic Node.js repository with **Express + TypeScript** (backend) and **React + Vite + TypeScript** (frontend). It included:

- **Backend**: Basic Room CRUD — `createRoom`, `joinRoom`, `getRoom`, `startGame`; in-memory `Map<string, Room>` store; Express router with CORS; a seed word list.
- **Frontend**: React Router v6 (lobby + game routes); context-based state store using `useSyncExternalStore`; API client with typed `request<T>` wrapper; UI primitives (`Card`, `RoomCodeBadge`, `PageHeader`); CSS design system (variables, cards, buttons, responsive grid).
- **Constitutional constraints** baked into `AGENTS.md`: no WebSockets, no databases, no authentication, no new top-level dependencies, TypeScript strict, no feature branches.

It was a shell — the room model had participants and a host, but no game mechanics, no drawing, no scoring, no rounds.

---

### What did you add?

#### Scenario 1 — Room Setup & Lobby

Extended the lobby with real-time participant tracking, host identification, and game readiness. Added `hostId` to the Room model, Zod validation for player names (trimmed, non-empty), duplicate name disambiguation ("Player (2)"), a host badge in the participant list, 2-second auto-polling, and a host-only "Start Game" button gated on 2+ players. Network errors surface a visual indicator without crashing the UI.

#### Scenario 2 — Game Start & Drawer Flow

Introduced the concept of rounds and roles. Added `currentDrawerId`, `roundNumber`, and `secretWord` to the Room model. The host becomes the drawer on game start (round 1). The secret word is deterministically selected from the seed word list by round index. The word is only visible to the drawer in room snapshots — guessers receive `null`. Name trimming via Zod `.trim()` propagates through all participant helpers.

#### Scenario 3 — Gameplay Interaction

The core gameplay loop. Added `Point`, `Stroke`, and `Guess` types along with `scores`, `guesses`, `correctGuessers`, and `canvasStrokes` to the Room model.

**Backend**: `submitGuess` does case-insensitive exact matching for 100 points, rejects empty/overlong guesses, prevents double-scoring, and tracks all guesses. Canvas CRUD functions let the drawer save/clear strokes. Zod schemas validate all inputs.

**Frontend**: An HTML5 Canvas component with pointer-event drawing (black, 3px stroke). Guessers poll the canvas at 1s for near-real-time sync. The room poll runs at 2s. Guess submission shows inline errors ("cannot be empty", "too long"). Scores and guess history are live via Scoreboard and ResultPanel components. The lobby auto-redirects to the game when the host starts.

**API routes**: `POST /:code/guess`, `GET /:code/canvas`, `POST /:code/canvas`, `POST /:code/canvas/clear`, `GET /:code/guesses`.

#### Scenario 4 — Result, Restart & Final Validation

Closed the game loop. Added `"result"` to `RoomStatus`. The round ends automatically when all guessers guess correctly; the drawer can also end it manually via an idempotent "End Round" button (handles race conditions). A `ResultView` component replaces the game UI inline — it shows the revealed secret word, final scores, and full guess history. The host can restart from the result view, which returns everyone to the lobby with participants and scores preserved but all round state cleared (canvas, guesses, drawer, round number).

**Fixes applied during analysis**: `getSecretWord` now returns the word for both "playing" and "result" statuses (it was locked to "playing" only). The GamePage poll redirect condition was changed from `!== "playing"` to `=== "lobby"` to avoid navigating away on "result". Canvas polling is gated on `status === "playing"` to avoid wasted requests. The `submitGuess` response includes the new `roomStatus` field so the frontend transitions immediately without waiting for the next poll cycle.

**API routes**: `POST /:code/end-round`, `POST /:code/restart`

---

### Architecture Summary

```
                        ┌──────────────────────┐
                        │   Room (in-memory)    │
                        │  code, status, hostId │
                        │  participants, scores │
                        │  guesses, canvas, ... │
                        └──────────┬───────────┘
                                   │
              ┌────────────────────┼────────────────────┐
              ▼                    ▼                    ▼
     ┌────────────────┐  ┌────────────────┐  ┌────────────────┐
     │   Lobby Page   │  │   Game Page    │  │  Result View   │
     │  (poll 2s)     │  │ (poll 2s+1s)   │  │ (inline, poll) │
     │  join/start    │  │ draw/guess     │  │ word/scores    │
     └────────────────┘  └────────────────┘  └────────────────┘
              │                    │                    │
              └────────────────────┼────────────────────┘
                                   │
                                   ▼
                        ┌──────────────────────┐
                        │    Room Store + API   │
                        │  (React context +     │
                        │   HTTP polling)       │
                        └──────────────────────┘
```

All sync is HTTP polling (2s for room state, 1s for canvas). No WebSockets. No database. No authentication. Everything is in-memory on the server. The frontend uses a single context store with `useSyncExternalStore` for reactive updates.

### Key Decisions

- **No timer for rounds** — rounds end when all guessers guess correctly or the drawer ends it manually. No countdown infrastructure.
- **Flat 100-point scoring** — no speed bonus, no partial credit. First correct guess in a round is worth 100.
- **Exact case-insensitive matching** — "Rocket" matches "rocket" but "hot  dog" (double space) does not match "hot dog".
- **Scores persist across rounds** — only reset when a new game starts from the lobby.
- **Inline result view** — no separate route; the GamePage swaps canvas/guess UI for the result display when status is `"result"`.

### Files Changed or Created

**Backend** (7 files touched):
- `backend/src/models/game.ts` — RoomStatus union, Point/Stroke/Guess types, Room/RoomSnapshot fields
- `backend/src/api/schemas.ts` — Zod schemas for guess, canvas, endRound, restartGame
- `backend/src/api/rooms.ts` — 7 new routes (guess, canvas CRUD, end-round, restart)
- `backend/src/services/roomStore.ts` — submitGuess, canvas CRUD, endRound, restartGame, getSecretWord fix
- `backend/src/seed/starterData.ts` — word list (unchanged)

**Frontend** (8 files touched):
- `frontend/src/services/api.ts` — types for all new entities, API methods for guess/canvas/endRound/restartGame
- `frontend/src/state/roomStore.ts` — store methods for all gameplay/result operations, canvas state management
- `frontend/src/pages/LobbyPage.tsx` — auto-redirect on game start
- `frontend/src/pages/GamePage.tsx` — canvas integration, guess form, polling, result detection, End Round button
- `frontend/src/components/Canvas.tsx` — HTML5 Canvas drawing component
- `frontend/src/components/GuessForm.tsx` — guess input with validation
- `frontend/src/components/Scoreboard.tsx` — live scores
- `frontend/src/components/ResultPanel.tsx` — guess history
- `frontend/src/components/ResultView.tsx` — result display (new)
- `frontend/src/styles/app.css` — canvas, scoreboard, guess history, result view styles

### Build Health

Both backend and frontend compile with **zero errors, zero warnings** across all TypeScript strict checks.
