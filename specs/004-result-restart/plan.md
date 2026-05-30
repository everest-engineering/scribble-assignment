# Implementation Plan: Result & Restart

**Branch**: `004-result-restart` | **Date**: 2026-05-31 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/004-result-restart/spec.md`

## Summary

Implement the end-of-round result screen and the manual host lobby transition. The result screen will display the correct word, player points earned, and a snapshot of the final drawing. The host will have a manual action to reset the game room and return all players to the lobby waiting state, where player scores are reset to zero.

## Technical Context

**Language/Version**: TypeScript

**Primary Dependencies**: Node.js, Express, Zod (Backend) | React 18, React Router 6, Vite (Frontend)

**Storage**: In-memory (Backend) only. No database.

**Testing**: Standard testing frameworks included in the project setup (e.g., Vitest/Jest for React/Node).

**Target Platform**: Web application (Frontend + Backend).

**Project Type**: Multiplayer Drawing Game (Web App).

**Performance Goals**: Frontend must implement efficient polling (~2s intervals) to simulate real-time updates.

**Constraints**: HTTP polling only (no WebSockets). No Authentication. All application state must reside in-memory. Cross-site scripting (XSS) must be mitigated.

**Scale/Scope**: Minimal memory footprint for active game rooms.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **I. TypeScript-First**: Fully typed in TypeScript.
- [x] **II. Architecture Constraints**: State remains in-memory. Backend handles HTTP polling. No databases used.
- [x] **III. Security**: Zod validation will be used for any new API endpoints or state updates. XSS mitigation will be applied when rendering the correct word or drawing snapshot.
- [x] **IV. Testing**: Code changes maintain internal consistency and traceability.
- [x] **V. Error Handling**: Errors from manual lobby resets will be caught and displayed gracefully.
- [x] **Out of Scope Check**: Does not introduce WebSockets, DBs, Auth, or complex gameplay extensions like multiple rounds (returns to lobby instead).

## Project Structure

### Documentation (this feature)

```text
specs/004-result-restart/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
└── contracts/
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── api/          # Add/update route for host returning room to lobby
│   ├── models/       # Update room state to include `results` phase and round results
│   └── services/     # Logic to transition from `playing` -> `results` -> `lobby`, including score resets and canvas clearing
frontend/
├── src/
│   ├── components/   # Result screen component showing word, scores, and drawing
│   ├── pages/        # Game page rendering based on new `results` state
│   └── state/        # roomStore.ts updates for new game phases
```

**Structure Decision**: Selected Option 2 (Web application with frontend/backend split) as it perfectly aligns with the current monolithic repository layout described in the Constitution.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

*No violations detected.*
