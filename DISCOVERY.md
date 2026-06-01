# Discovery Notes (Brownfield Scribble Lab)

**Date**: 2026-06-01  
**Scope**: Starter scaffold → full `lobby → drawing → result → lobby` flow (features 001–004)

This document satisfies the lab discovery requirement: **≥3 gaps**, **≥2 assumptions**, and **relevant files** before Spec Kit work began.

---

## Starter gaps (incomplete behaviors)

| # | Gap | Starter behavior | Target behavior (spec) |
|---|-----|------------------|------------------------|
| G1 | **Host & start game** | Any client could navigate to `/game`; no `hostParticipantId` or start API | Creator is host; only host starts when ≥2 players; `POST /rooms/:code/start` |
| G2 | **Lobby sync** | Manual “refresh” only on lobby | Automatic HTTP polling ~2s so guests see new players without reload |
| G3 | **Round gameplay** | Canvas, guess form, scoreboard, and results were non-functional placeholders | Drawer draws (PUT canvas), guessers submit guesses (+100/0), history and scores sync via poll |
| G4 | **Round end & restart** | No `result` status or restart path | First correct guess → `result` with revealed word; host restart clears round state, scores → 0 |
| G5 | **Join guards** | Join only checked room existence | Reject join during `drawing`; allow join during `result` (004); distinct errors for empty name, unknown code, full room |

---

## Assumptions

| # | Assumption | Rationale |
|---|------------|-----------|
| A1 | **HTTP polling (~2s)** is the only sync mechanism (no WebSockets) | Constitution + README forbid real-time push; matches lobby/game/result quickstarts |
| A2 | **`sessionStorage`** holds `{ roomCode, participantId }` per tab for resume after refresh | 001 research R2; aligns with disconnect pruning without cookies/auth |
| A3 | **30s presence timeout** before pruning idle participants is acceptable | 001 research R3; brief network blips should not drop players immediately |
| A4 | **Single round per “game start”** — no drawer rotation or multi-round tournament in scope | README out-of-scope; restart returns to lobby for a fresh round one |
| A5 | **Word list is fixed** (`starterData.ts`); selection is deterministic by room code + round number | Constitution deterministic game rules; no custom word packs |

---

## Relevant files (starter inventory)

### Backend

| Path | Role |
|------|------|
| `backend/src/server.ts` | Express entry |
| `backend/src/app.ts` | App wiring, error handler |
| `backend/src/api/router.ts` | Route mount |
| `backend/src/api/rooms.ts` | Room HTTP handlers (extended for start, canvas, guesses, restart) |
| `backend/src/api/schemas.ts` | Zod validation |
| `backend/src/services/roomStore.ts` | In-memory rooms, business rules |
| `backend/src/models/game.ts` | Types: `Room`, `RoomSnapshot`, strokes, guesses |
| `backend/src/seed/starterData.ts` | Word list |

### Frontend

| Path | Role |
|------|------|
| `frontend/src/routes/index.tsx` | Routes: `/`, `/lobby`, `/game`, `/results` |
| `frontend/src/pages/*.tsx` | Start, create, join, lobby, game, result screens |
| `frontend/src/state/roomStore.ts` | Client room session + API calls |
| `frontend/src/state/session.ts` | `sessionStorage` persistence |
| `frontend/src/services/api.ts` | REST client |
| `frontend/src/components/DrawingCanvas.tsx` | Canvas draw/clear + debounced PUT |
| `frontend/src/styles/app.css` | Layout and game UI |

### Spec Kit artifacts

| Path | Role |
|------|------|
| `.specify/memory/constitution.md` | Engineering + game rules |
| `specs/001-host-join-rooms/` … `specs/004-result-restart-lobby/` | Per-feature spec, plan, tasks, contracts, quickstart |

---

## Traceability map (features → primary code)

| Feature | Spec folder | Key implementation |
|---------|-------------|-------------------|
| 001 Host/join/lobby | `specs/001-host-join-rooms` | `roomStore.ts` create/join/start/prune; `LobbyPage.tsx` poll |
| 002 First-round drawer | `specs/002-first-round-drawer` | `wordSelection.ts`, `assignRoundOneRoles`, `GamePage` role UI |
| 003 Draw/guess/score | `specs/003-round-draw-guess` | `guessLogic.ts`, canvas/guess routes, `DrawingCanvas`, poll on game |
| 004 Result/restart | `specs/004-result-restart-lobby` | `endRound`, `restartGame`, `ResultPage.tsx` |

See [REFLECTION.md](./REFLECTION.md) for decisions, AI usage, and tradeoffs.
