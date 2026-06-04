# Implementation Plan: Gameplay Interaction

**Branch**: `003-gameplay-interaction` | **Date**: 2026-06-03 | **Spec**: [.specify/specs/003-gameplay-interaction/spec.md](spec.md)

**Input**: Gameplay interaction for an active game round.

## Summary

This feature implements core gameplay interaction mechanics, including drawing on a canvas, submitting guesses, validating inputs, scoring correct guesses, and synchronizing game state via polling.

## Technical Context

**Language/Version**: TypeScript

**Primary Dependencies**: React (v18), Vite, Node.js, Express, Zod

**Storage**: In-memory (per Constitution Principle II)

**Testing**: Vitest

**Target Platform**: Web (Vite-served)

**Project Type**: Web Application

**Performance Goals**: Responsive drawing (<200ms latency), real-time-like updates via polling (<2s).

**Constraints**: Stateless backend (no DB), no WebSockets (polling only).

## Constitution Check

*Compliance verified against [Constitution](.specify/memory/constitution.md):*
1. **TypeScript**: Strict mode enabled.
2. **Stack**: React/Vite/TypeScript/Node/Express/Zod used. HTTP Polling. No WebSockets/DB/Auth.
3. **Architecture**: Services/Models/API separation followed.
4. **Minimalism**: Features restricted to canvas, guessing, scoring, and synchronization.
5. **Scope**: Adheres to Gameplay Interaction feature.
6. **Testing**: Vitest to be used. Coverage target >= 90%.

## Project Structure

### Source Code

```text
backend/
├── src/
│   ├── api/
│   │   ├── rooms.ts          # Updated with game round logic
│   │   └── router.ts
│   ├── models/
│   │   └── game.ts           # Updated with Guess, Scoreboard
│   └── services/
│       └── roomStore.ts      # Updated for round state management
└── tests/

frontend/
├── src/
├── components/
│   ├── Canvas.tsx         # Drawing interaction
│   ├── GuessForm.tsx      # Guess submission
│   └── ResultPanel.tsx       # Guess history
│   ├── services/
│   │   └── api.ts            # Polling integration
│   └── state/
│       └── roomStore.ts      # UI state for round
└── tests/
```

**Structure Decision**: Selected option 2 (Web application) as the project includes both `backend/` and `frontend/` folders.
