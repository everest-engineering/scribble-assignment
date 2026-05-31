# Implementation Plan: Gameplay Interaction

**Branch**: `003-gameplay-interaction` | **Date**: 2026-05-31 | **Spec**: [spec.md](spec.md)

## Summary

Implement the core gameplay loop: drawer draws on a canvas, guessers submit guesses, guesses are compared case-insensitively against the secret word, correct guesses score 100, and all state (drawing, guesses, scores) is synced via polling.

## Technical Context

**Language/Version**: TypeScript 5.6 (Node.js 24, React 18)

**Primary Dependencies**: Express 4.21, React 18.3, Zod 3.23

**Storage**: In-memory — add guesses and drawing strokes to Round model

**Testing**: Vitest 3.1

**Constraints**: No WebSockets, no databases, no auth; HTTP polling

## Constitution Check

- [x] TypeScript First: All new code fully typed
- [x] HTTP Polling Only: Guesses, scores, drawing synced via `GET /rooms/:code`
- [x] In-Memory State: Guesses and drawing stored in Round on the Room
- [x] Immutability: structuredClone copies
- [x] Spec-Driven: Implementation follows approved spec

## Project Structure

```
specs/003-gameplay-interaction/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/api.md
└── checklists/requirements.md

backend/src/
├── models/game.ts              # Add Guess, Drawing types; add to Round
├── services/roomStore.ts       # Add submitGuess, drawingData to round
├── api/rooms.ts                # Add POST /:code/guess
├── api/schemas.ts              # Add guessSchema

frontend/src/
├── components/Canvas.tsx        # NEW: drawing canvas component
├── components/GuessForm.tsx     # Update: submit to backend via store
├── components/Scoreboard.tsx    # Update: show real scores from room
├── components/ResultPanel.tsx   # Update: show guess history
├── pages/GamePage.tsx           # Update: integrate canvas + polling
├── state/roomStore.ts           # Add submitGuess method
├── services/api.ts              # Add submitGuess API call
```

## Complexity Tracking

No constitution violations.
