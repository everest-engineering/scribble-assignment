# Implementation Plan: Result, Restart & Final Validation

**Branch**: `004-result-restart-validation` | **Date**: 2026-05-31 | **Spec**: [spec.md](spec.md)

## Summary

Implement round-end logic (correct guess → reveal word → "round_end" status), next-round advancement (rotating drawer, new word, clear canvas), game-over detection (after all participants have drawn), and restart (reset scores/rounds back to lobby). Wire frontend buttons and states for each transition.

## Technical Context

**Language/Version**: TypeScript 5.6 (Node.js 24, React 18)

**Primary Dependencies**: Express 4.21, React 18.3, Zod 3.23

**Storage**: In-memory — add nextRound/restart logic to roomStore

**Testing**: Vitest 3.1

**Constraints**: No WebSockets, no databases, no auth; HTTP polling

## Constitution Check

- [x] TypeScript First: All new code fully typed
- [x] HTTP Polling Only: Round transitions synced via `GET /rooms/:code`
- [x] In-Memory State: Room mutations for round advance and restart
- [x] Immutability: structuredClone copies
- [x] Spec-Driven: Implementation follows approved spec

## Project Structure

```
specs/004-result-restart-validation/
├── spec.md
├── plan.md
├── tasks.md
└── checklists/
    └── requirements.md

backend/src/
├── services/roomStore.ts       # Add endRound (triggered on correct guess), nextRound, restartGame
├── api/rooms.ts                # Add POST /:code/next-round, POST /:code/restart
├── api/schemas.ts              # Add nextRoundSchema, restartSchema (participantId only)

frontend/src/
├── pages/GamePage.tsx           # Handle round_end and game_over states
├── pages/LobbyPage.tsx          # Handle restart redirect
├── state/roomStore.ts           # Add nextRound, restartGame methods
├── services/api.ts              # Add nextRound, restartGame API calls
```

## Complexity Tracking

No constitution violations.
