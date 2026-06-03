# Implementation Plan: Gameplay Interaction

**Branch**: `scribble-lab` | **Date**: 2026-06-03 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/003-gameplay-interaction/spec.md`

## Summary

Implement the core gameplay loop where a drawer can draw/clear the canvas, guessers can submit guesses (trimmed, case-insensitive, <=50 chars, no empty guesses), and scoring awards 100 points to correct guesses (even concurrent ones). All state (drawing and guesses) is synchronized via HTTP polling at 1000ms intervals. The round will end if the drawer stops polling for more than 10 seconds.

## Technical Context

**Language/Version**: TypeScript / Node.js
**Primary Dependencies**: Express, React 18, React Router v6, Zod, Zustand
**Storage**: In-memory only (per constitution)
**Testing**: None specified
**Target Platform**: Web application
**Project Type**: Multiplayer Game Web App
**Performance Goals**: 1000ms polling interval
**Constraints**: No WebSockets, no databases
**Scale/Scope**: Typical room sizes

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. TypeScript First & Strict Styling**: Passed. All code will use TypeScript and strict types.
- **II. Minimal In-Memory & Polling Architecture**: Passed. Will implement HTTP polling at 1000ms and keep state in memory. No WebSockets.
- **III. Extend, Don't Replace**: Passed. Will extend existing `backend/src` and `frontend/src` code.
- **IV. Strict Scope Guardrails**: Passed. No databases or WebSockets used.
- **V. AI & Review Discipline**: Passed.

## Project Structure

### Documentation (this feature)

```text
specs/003-gameplay-interaction/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── models/     # Room and Game state models
│   ├── services/   # Polling and game logic
│   └── api/        # Polling endpoints, drawing endpoints, guess endpoints
└── tests/

frontend/
├── src/
│   ├── components/ # Canvas, Guess Input, Chat/Guess History
│   ├── pages/      # Game Room Page
│   └── services/   # API polling hooks/logic
└── tests/
```

**Structure Decision**: Option 2: Web application. Following the monolithic structure with `/backend` and `/frontend`.

## Complexity Tracking

No violations of the Constitution.
