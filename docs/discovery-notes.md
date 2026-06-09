# Discovery Notes — Scribble

**Date**: 2026-06-09
**Branch**: scaffold (starter)
**Scope**: Full backend + frontend codebase review before feature implementation.

---

## Overview

This document captures findings from inspecting the Scribble starter codebase. The
project is a brownfield enhancement of a multiplayer drawing game with an
Express/TypeScript backend and a React/TypeScript frontend. The starter provides
room creation/joining, a lobby view, and a game page shell. All game-round logic,
drawing interaction, scoring, and lifecycle management are absent.

---

## Relevant Files

### Backend (`backend/`)

| File | Purpose | Status |
|---|---|---|
| `src/models/game.ts` | Data types: `Room`, `Participant`, `RoomSnapshot`, `RoomStatus` | **Stub** — only `"lobby"` status defined; no scores on participants |
| `src/services/roomStore.ts` | In-memory room CRUD, snapshot builder | **Stub** — `viewerParticipantId` unused; roles not mapped to participants |
| `src/api/rooms.ts` | Route handlers for rooms | **Partial** — only create/join/fetch, no start-game or game-action routes |
| `src/api/schemas.ts` | Zod validation schemas | **Partial** — `playerName` optional everywhere; no guess/action schemas |
| `src/seed/starterData.ts` | Fixed word list and role constants | **Complete as-is** — 5 words, 2 roles |
| `src/api/router.ts` | Express router setup, error/not-found handlers | **Complete** |
| `src/app.ts` | Express app factory with CORS, JSON, health check | **Complete** |
| `src/services/roomStore.test.ts` | Unit tests for roomStore | **Partial** — 2 tests, no coverage for game logic |

### Frontend (`frontend/`)

| File | Purpose | Status |
|---|---|---|
| `src/services/api.ts` | HTTP client for backend API | **Bug** — base URL is `http://localhost:3001/bug` (likely typo for `/api` or bare origin) |
| `src/state/roomStore.ts` | State store (Context + `useSyncExternalStore`) | **Partial** — no polling loop, no game-action methods |
| `src/pages/LobbyPage.tsx` | Lobby with participant list, refresh, start | **Partial** — manual refresh only, no auto-poll, no host check |
| `src/pages/GamePage.tsx` | 3-column game layout | **Stub** — all content areas are placeholders |
| `src/pages/CreateRoomPage.tsx` | Create room form | **Complete** |
| `src/pages/JoinRoomPage.tsx` | Join room form | **Complete** |
| `src/components/GuessForm.tsx` | Guess input and submit | **Stub** — `handleSubmit` is an empty function |
| `src/components/Scoreboard.tsx` | Score display | **Placeholder** — hardcoded text |
| `src/components/ResultPanel.tsx` | Activity/guess history | **Placeholder** — hardcoded text |
| `src/pages/StartPage.tsx` | Landing page | **Complete** |
| `src/styles/app.css` | All application styles | **Complete** |

---

## Implementation Gaps

### 1. Room Setup & Lobby (Scenario 1)

**Host tracking missing.** The first player to create a room has no special status.
The `Participant` type (`game.ts:8-11`) has no `isHost` flag. Any player can click
"Start Game" on the Lobby page — there is no host-gating.

**No start-game endpoint.** The "Start Game" button in `LobbyPage.tsx:97` calls
`navigate("/game")` directly without hitting any backend API. There is no endpoint
to transition a room from `"lobby"` to a playing state. Two players clicking
simultaneously would both navigate to `/game` with stale state.

**No 2-player minimum enforcement.** The lobby shows "Start Game" even when only
one player (the creator) is present. Scenario 1 requires at least 2 players.

**No automatic lobby polling.** The "Refresh Room" button (`LobbyPage.tsx:53-60`)
manually calls `fetchRoom()`. There is no polling loop. Players must click refresh
to see new joiners.

**No join validation.** `joinRoom` silently accepts empty player names. Empty codes
or codes that don't exist return a generic 404 rather than a clear validation error.
The `playerName` field is optional in both `createRoomSchema` and `joinRoomSchema`
(`schemas.ts:3-10`).

### 2. Game Start & Drawer Flow (Scenario 2)

**No drawer assignment.** The `roles` field in `RoomSnapshot` always returns
`["drawer", "guesser"]` as a flat array, not mapped to individual participants.
The `toRoomSnapshot` function (`roomStore.ts:99-108`) never assigns who is the
drawer.

**No word hiding.** `viewerParticipantId` is accepted but discarded
(`roomStore.ts:100` — `void viewerParticipantId`). Every viewer sees the full
`availableWords` list. There is no logic to show the secret word only to the drawer.

**No deterministic word selection.** `listWords()` returns the full 5-word array.
There is no per-round word selection algorithm. No round counter exists.

**No player name validation.** `displayName()` defaults to `"Player"` if name is
falsy. Trimming is not performed, and whitespace-only names pass through. Scenario 2
requires trimmed names with empty/whitespace-only rejection.

### 3. Gameplay Interaction (Scenario 3)

**Canvas is a placeholder.** `GamePage.tsx:31-33` renders a styled `<div>` with
"Waiting for drawer..." text. No drawing surface, no brush, no color picker, no
clear action. The canvas area exists as DOM only.

**Guess submission does nothing.** `GuessForm.tsx:9` `handleSubmit` is `() => {}` —
empty function. No API call, no state update, no validation. Submitting a guess
silently does nothing.

**No guess endpoint on backend.** There is no `/rooms/:code/guess` or similar
endpoint. No way to send, validate, or store guesses server-side.

**No scoring anywhere.** The `Scoreboard` component shows hardcoded `"Waiting for
players..."` and `0`. The `Participant` type has no `score` field. There is no
scoring algorithm (correct = 100, incorrect = 0).

**No guess history sync.** `ResultPanel` shows `"Game activity and guesses will
appear here."` There is no mechanism to sync guesses between players via polling.
No guess history model exists on the backend or frontend.

**No clear canvas action.** Even as a stub, there is no clear-canvas button or
endpoint.

### 4. Result & Restart (Scenario 4)

**No result state.** `RoomStatus` is `"lobby"` only (`game.ts:2`). There is no
`"playing"`, `"round_end"`, or `"finished"` status. No endpoint returns a round
result (correct word, final scores, guess history).

**No restart flow.** There is no API endpoint to reset round state while preserving
participants. Navigating back to `/lobby` from the game page just goes to the
current lobby state — there is no way to clear round data.

**No round tracking.** `GamePage.tsx:33` hardcodes `"Round 1"`. There is no
round counter on the backend model or in the frontend store.

---

## Assumptions

1. **Deterministic word selection via index arithmetic.** Since Principle I forbids
   randomness, word selection must use a deterministic formula. The most natural
   approach is `STARTER_WORDS[roundIndex % STARTER_WORDS.length]` — round 1 gets
   `"rocket"`, round 2 gets `"pizza"`, etc. This is consistent with the starter
   word list being fixed and non-extensible.

2. **Host is the drawer for round 1.** The room creator (first participant in the
   `participants` array) becomes the drawer in the first round. This is
   deterministic and avoids any selection ambiguity. Subsequent round drawer
   rotation is out of scope per the out-of-scope list.

3. **`/bug` in the API base URL is unintentional.** The frontend API base URL is
   `"http://localhost:3001/bug"` (`api.ts:18`). The backend has no `/bug` route.
   This would cause all API calls to 404 in production. Likely a configuration
   typo that should be `"http://localhost:3001"` or `"http://localhost:3001/api"`.

4. **"First correct guess ends the round" is implied.** The spec says correct
   guesses score 100. The most natural reading is that the first correct guess in
   a round ends the round and awards points. This prevents multiple guessers from
   independently scoring 100 on the same word.

---

## Risks & Unknowns

| Risk | Impact | Notes |
|---|---|---|
| Race conditions on start | Two players could both see stale lobby state | Need a backend-enforced start-game endpoint with atomic status transition |
| No timeout mechanism | Rounds never end if no one guesses correctly | Spec does not mention timers; currently impossible to transition out of a playing state |
| Memory leak from abandoned rooms | Inactive rooms accumulate indefinitely | No cleanup strategy exists despite AGENTS.md requirement |
| `structuredClone` overhead | Defensive cloning on every read/write | Acceptable for lab scale but no GC for abandoned rooms |
| Canvas implementation complexity | Drawing interaction is the hardest UI piece | Unknown whether to use Canvas API, SVG, or a library; no decisions have been made |
| Hardcoded "Round 1" | Round counter does not exist anywhere | Even if multi-round is out of scope, a round counter is needed for the single round |
