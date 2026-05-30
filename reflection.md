# Reflection Report — Scribble Lab

**Branch:** `scribble-lab`  
**Date:** 2026-05-30

## What did the starter app already have?

The starter was a runnable but intentionally incomplete brownfield scaffold:

- **Stack:** Vite + React + TypeScript frontend; Node.js + Express + TypeScript backend with in-memory room storage.
- **UI shell:** Branded Start, Create Room, Join Room, Lobby, and Game pages with routing already wired.
- **Partial room flow:** Create room, join by code, and fetch room snapshot worked end-to-end for basic lobby display.
- **API surface (3 endpoints):** `POST /rooms`, `POST /rooms/:code/join`, `GET /rooms/:code`, plus `GET /health`.
- **Seed data:** Starter words (`rocket`, `pizza`, `castle`, `guitar`, `sunflower`) and roles (`drawer`, `guesser`) defined but unused in gameplay.
- **Placeholder game UI:** Canvas area, guess form, scoreboard, and result panel existed visually but had no real behavior—scores stayed at 0, guesses were not submitted, and Start Game only navigated client-side without calling the backend.

What was **not** in the starter: host tracking, automatic polling, start-game permissions, drawer assignment, secret word visibility rules, drawing, guess history sync, scoring, result state, or restart.

## What did you add?

### Spec Kit artifacts and process

- **Discovery notes** (`discovery.md`) documenting five incomplete behaviors, five assumptions, and relevant files before writing code.
- **Constitution** (`.specify/memory/constitution.md` v1.0.0) constraining brownfield scope, TypeScript/Zod validation, HTTP-only polling, and no auth/DB/WebSockets.
- **Four feature iterations** under `specs/001`–`specs/004`, each with spec, plan, tasks, data model, API contracts, quickstart, and checklists—implemented and merged incrementally (PRs #1–#7).

### Backend

- Extended `Room` model with `hostId`, game phases (`lobby` → `playing` → `result`), drawer assignment, deterministic word selection, canvas strokes, guesses, and scoring.
- Six new REST endpoints: start, strokes, clear canvas, guesses, end round, restart.
- Viewer-scoped snapshots via `participantId` query param so guessers never receive the secret word during play.
- Expanded Zod schemas and `roomStore.test.ts` coverage for room lifecycle and game rules.

### Frontend

- Automatic ~2s HTTP polling in lobby and game views (no WebSockets).
- Host-only start with 2-player minimum; name trim and empty-name validation on create/join.
- New `DrawingCanvas` component with drawer-only draw/clear controls and stroke sync for guessers.
- Functional guess submission, live scoreboard, guess history, in-place result mode (word revealed, canvas hidden), and host-driven restart back to lobby.
- Extended `roomStore.ts` and `api.ts` for all game actions without adding new state libraries.

## Key decisions and tradeoffs

| Decision | Rationale |
|----------|-----------|
| HTTP polling (~2s) | Required by lab constraints; simpler than WebSockets and sufficient for two-tab validation. |
| Viewer-scoped `GET` snapshots | Reused the starter’s `participantId` hook instead of adding auth or separate endpoints per role. |
| Deterministic word selection | Same room state always yields the same word (`rocket` for first round), making multi-tab tests reproducible. |
| In-place result mode (no route change) | Clarified in Scenario 4 spec; avoids extra routing while keeping polling logic on one screen. |
| Incremental scenario delivery | Each scenario was spec’d, planned, implemented, and validated before the next—keeps commits traceable to acceptance criteria. |

## AI-assisted workflow

Spec Kit drove the workflow: discovery → constitution → specify → clarify → plan → tasks → implement → validate. AI generated most of the boilerplate (spec templates, task lists, API contracts) and implementation drafts; human review focused on alignment with constitution constraints (especially no WebSockets/DB), edge cases (guess in flight at end-round, case-insensitive scoring), and two-browser manual validation per quickstart.

## What I would do differently

- Fix the default `VITE_API_URL` (`/bug` suffix) earlier—it was flagged in discovery and can confuse first-time local setup.
- Run backend tests after each scenario slice rather than batching at the end of a long session.

## Validation

End-to-end flow verified with two browser tabs: create/join lobby → host starts game → drawer draws and guest guesses → correct guess scores 100 → host ends round (shared result) → host restarts (lobby cleared, players preserved). Backend unit tests pass via `cd backend && npm test`.
