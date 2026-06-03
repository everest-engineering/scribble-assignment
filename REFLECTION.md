# Reflection Report

## What the starter app already had
- Vite + React + TypeScript frontend with page routing (Start, Create Room, Join Room, Lobby, Game)
- Express + TypeScript backend with in-memory room store, health endpoint, and starter CRUD routes
- Seed data (5 words, 2 roles)
- Placeholder UI components (canvas, guess input, scoreboard, result areas)

## What I added
- **Host tracking**: First creator is host (`isHost: true`), host-only start/restart enforcement
- **Lobby polling**: Automatic 2s HTTP polling on Lobby and Game pages for live state sync
- **Drawer assignment**: Host is drawer for the single round, secret word deterministically selected from starter list
- **Word visibility rules**: Drawer sees secret word via `participantId` filtering in `toRoomSnapshot`; guessers see `undefined`
- **Canvas interaction**: Mouse-based drawing (mousedown/move/up) and clear functionality — local to drawer's browser
- **Guess system**: Trimmed, case-insensitive comparison, empty/drawer-guess rejection, correct = 100 pts
- **Result state**: On correct guess, status transitions to `finished`, word revealed to all, scores and history displayed
- **Restart flow**: Host-only restart resets round state (guesses, scores, drawer, word) but preserves participants
- **Status-based navigation**: Players auto-redirect on status transitions (lobby→playing→lobby)
- **Edge case hardening**: Player name validation (trim/reject empty/whitespace), bad room codes, non-host action rejection, join-during-game guard

## Key decisions
- No WebSockets/Socket.io — HTTP polling at 2s cadence per lab constraints
- In-memory `Map` store — no database, consistent with constraints
- Drawer = host (no rotation, single round per requirements)
- Word = `STARTER_WORDS[0]` ("rocket"), deterministic per round index
- Canvas data is local-only — not synced to guessers (explicitly out of scope)

## AI usage
- Spec Kit artifacts (constitution, specs, plans, tasks) were AI-assisted but manually reviewed and refined
- Implementation code was AI-generated and verified against acceptance criteria via curl E2E tests
- Debugging was a collaborative process: AI suggested root causes, user reported real-world behavior, fixes were validated together
- The join-during-game gap was caught by auditing the rubric — AI identified the missing guard

## Tradeoffs
- Polling adds latency (up to 2s) vs. real-time sync, but keeps the architecture simple
- No duplicate-participant check on join was documented as a known gap; edge case deemed low priority
- Room cleanup (inactive room removal) not implemented — rooms persist in memory until server restart
- Single-word deterministic selection limits replayability but is sufficient for a one-round demo

## Build validation
Both backend and frontend build with zero type errors.
