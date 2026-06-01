# Implementation Plan: Round Results and Lobby Restart

**Branch**: `004-result-restart-lobby` | **Date**: 2026-06-01 | **Spec**: [spec.md](./spec.md)

## Summary

On **first correct guess**, transition `drawing` → **`result`**, reveal word and round history to all, and **auto-navigate** to a result screen (~2s poll). **Host-only restart** returns room to **`lobby`**: roster preserved, scores reset to 0, round state cleared; all clients **auto-navigate** to lobby. Allow **join during `result`** (extends 001 join guard).

## Technical Context

**Language/Version**: TypeScript (Node + React 18)  
**Storage**: In-memory `roomStore`  
**Sync**: HTTP polling ~2000ms (no WebSockets)  
**Depends on**: `001` (host, join), `002` (round start), `003` (guesses, scores, canvas, `submitGuess`)

## Constitution Check

*GATE: Pass*

| Principle | Compliance |
|-----------|------------|
| Game Logic | `lobby → drawing → result → lobby`; first correct ends round |
| V. Testing | Test-first for `endRoundOnCorrectGuess`, `restartGame`, join-in-result |
| No WebSockets | Poll-driven navigation |

## Project Structure

```text
backend/src/api/rooms.ts, services/roomStore.ts, models/game.ts
frontend/src/pages/ResultPage.tsx (new), LobbyPage.tsx, GamePage.tsx
frontend/src/routes/index.tsx
```

## Gap Analysis

| Requirement | Current | Action |
|-------------|---------|--------|
| FR-001 End round | Guesses don't change status | `endRound()` on first correct in `submitGuess` |
| FR-002–005 Result UI | Placeholder `ResultPanel` | `ResultPage` + snapshot fields |
| FR-006, FR-015 Auto-nav | Manual routes only | Poll status → `/results` or `/lobby` |
| FR-007–012 Restart | No endpoint | `POST /restart`; clear round; scores=0 |
| FR-014 Join in result | 001 blocks non-lobby | Allow `status === result` on join |
| FR-013 Start again | After restart lobby | Reuse 001 start |

## Out of Scope

- Host transfer if host disconnects on result screen
- Preserving scores across restart

## Implementation Sequence

1. `endRound` hook in guess flow; freeze further guesses
2. Result snapshot (`revealedWord`, `roundGuesses`, session scores)
3. `restartGame` service + route
4. Join guard update for `result`
5. `ResultPage` + routing + poll navigation
6. Tests + quickstart

## Complexity Tracking

No constitution violations.
