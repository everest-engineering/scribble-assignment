# Implementation Plan: Game Start and Drawer Flow

**Branch**: `002-game-start-drawer-flow` | **Date**: 2026-06-02 | **Spec**: `/specs/002-game-start-drawer-flow/spec.md`

## Summary

Implement round start logic with deterministic drawer assignment (host as drawer), deterministic word selection (`STARTER_WORDS[0]`), viewer-specific response filtering to hide the secret word from guessers, and score initialization to 0.

## Technical Context

**Language/Version**: TypeScript (backend Node.js/Express, frontend React/Vite)

**Primary Dependencies**: Express, Zod (backend); React Router v6 (frontend)

**Storage**: In-memory Map only; round state held on Room object

**Testing**: Vitest, manual two-tab validation

**Constraints**: No WebSockets, no database, no authentication

## Constitution Check

- Backend as source of truth: PASS — round state, drawer assignment, secret word all live on backend.
- Deterministic/testable behavior: PASS — host is always drawer, `STARTER_WORDS[0]` is always the word.
- Secret word protection: PASS — viewer-specific response filtering via `toRoomSnapshot()`.

## Project Structure

```
specs/002-game-start-drawer-flow/
├── spec.md
├── plan.md
└── tasks.md
```

### Source files to modify

```
backend/src/
├── models/game.ts          — add RoundState type
├── services/roomStore.ts   — round creation, drawer assign, word select, viewer filtering
└── services/roomStore.test.ts — tests for round state, drawer, word visibility

frontend/src/
├── pages/LobbyPage.tsx     — react to phase change, navigate to /game
├── pages/GamePage.tsx      — show drawer badge, secret word (drawer only), scoreboard
└── components/Scoreboard.tsx — render participant names and scores
```

## Implementation Steps

1. Add `RoundState` interface to game model (phase, drawerPlayerId, secretWord, drawing, guesses, winnerPlayerId).
2. Update `startRoom()` to create RoundState: assign host as drawer, set `STARTER_WORDS[0]` as secret word, zero all scores.
3. Update `toRoomSnapshot()` to filter `secretWord` — reveal only to drawer (or when viewerParticipantId matches drawerPlayerId).
4. Add GamePage route handling in LobbyPage (polling detects status change → navigate).
5. Update GamePage to show drawer identity and secret word (conditional on drawer role).
6. Update Scoreboard to render real participant names and scores.

## Risks

- Secret word leakage: mitigate by always filtering in `toRoomSnapshot()` before sending response. Never send raw room object to client.
