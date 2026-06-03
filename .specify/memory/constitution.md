# Scribble Game Constitution

This document establishes the binding engineering principles, architectural guardrails, and non-negotiable quality standards for the Scribble Game. All specifications, technical plans, and code implementations must comply with these laws.

## Core Principles

### Core Architectural Principles
- **Real-Time First:** The application relies on immediate state synchronization. All multiplayer event definitions, room handshakes, and game actions must prioritize low latency and minimal payload sizes via HTTP polling.
- **Strict Separation of Concerns:** Game state logic (scores, word management) must be kept strictly separated from UI rendering and Canvas drawing logic.
- **Server as the Source of Truth:** The backend server must handle all game state, word assignments, score calculations, and round management. The frontend is strictly a presentation and input layer.

### Tech Stack & Constraints
- **Frontend:** React 18 (TypeScript) with Vite. Style using plain CSS in `app.css` (existing pattern).
- **Backend:** Node.js (TypeScript) with Express + Zod validation.
- **Storage:** In-memory Map store (no Redis, no SQL/NoSQL databases).

### Code Quality
- TypeScript strict mode required. No `any` types.
- Functional components with hooks (no class components).
- Keep functions concise; prefer small, focused functions.

## Testing
- Unit tests for core game logic (room creation, joining, scoring, validation) using **Vitest**.
- Integration tests for API endpoints using **Vitest**.

## UX and Accessibility
- **Mobile Responsiveness:** Prefer layouts that scale reasonably on mobile browsers.

## Performance
- Keep an eye on bundle size; avoid unnecessary dependencies.

## Security
- Input sanitization on all player-submitted text (names, guesses, canvas text).
- No authentication, sessions, JWT, or OAuth.

**Version**: 1.0.0 | **Ratified**: 2026-06-01 | **Last Amended**: 2026-06-02
