# Implementation Plan: Game Start & Drawer Flow

**Branch**: `002-game-start-drawer` | **Date**: 2026-05-31 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-game-start-drawer/spec.md`

## Summary

Extend the Scenario 1 lobby/start flow with trimmed player name validation, round setup on `startGame` (drawer = host, deterministic secret word, scores at 0), viewer-filtered room snapshots so only the drawer receives `secretWord`, and game screen UI that shows drawer role, hidden word for guessers, live scoreboard, and ~2s polling.

## Technical Context

**Language/Version**: TypeScript — Node.js 18+ (backend), Vite/React 18 (frontend)

**Primary Dependencies**: Express, Zod, Vitest; React Router v6, existing `RoomStore`

**Storage**: In-memory `roomStore` Map (unchanged)

**Testing**: Vitest for `wordSelection`, name normalization, snapshot filtering, startGame round fields; manual two-tab validation per [quickstart.md](./quickstart.md)

**Target Platform**: Local dev — `:3001` / `:5173`

**Project Type**: Web app monorepo (`backend/` + `frontend/`)

**Performance Goals**: Game state visible within ~3s via polling

**Constraints**: HTTP polling only; host = drawer; no canvas/guess logic (Scenario 3)

**Scale/Scope**: Extends existing room model and 4 endpoints; 1 new util module; 4 frontend files + Scoreboard

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Reference: `.specify/memory/constitution.md` (v1.0.0)

| Gate | Requirement | Pass? |
|------|-------------|-------|
| Brownfield First | Extends Scenario 1 files; no rewrite | ✅ |
| Spec traceability | Maps to US1–US3 and FR-001–FR-010 | ✅ |
| Scope constraints | Polling only; in-memory; no auth | ✅ |
| TypeScript & Zod | Typed models; Zod name validation | ✅ |
| Deterministic rules | Word from code hash; host = drawer | ✅ |
| Incremental validation | Two-tab drawer/guesser test | ✅ |
| Build health | `npm run build` both apps | ✅ (target) |

Post-design re-check: All gates pass.

## Project Structure

### Documentation (this feature)

```text
specs/002-game-start-drawer/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/rooms-api.md
└── tasks.md          # /speckit-tasks (next)
```

### Source Code

```text
backend/src/
├── models/game.ts
├── services/roomStore.ts
├── services/wordSelection.ts      # NEW
├── services/roomStore.test.ts
├── services/wordSelection.test.ts # NEW
└── api/schemas.ts, rooms.ts

frontend/src/
├── services/api.ts
├── pages/CreateRoomPage.tsx, JoinRoomPage.tsx, GamePage.tsx
├── components/Scoreboard.tsx
└── state/roomStore.ts
```

**Structure Decision**: Brownfield extension per `AGENTS.md`; minimal new files.

## Implementation Sequence

### Phase A — Name validation (US1)

1. **`schemas.ts`**: `playerNameSchema = z.string().trim().min(1, "Player name is required")` on create/join.
2. **`roomStore.ts`**: Replace `displayName()` fallback; use trimmed names in `createParticipant`.
3. **`rooms.ts`**: Zod errors surface as 400 with message.
4. **`CreateRoomPage.tsx` / `JoinRoomPage.tsx`**: Client trim + empty check before API.
5. **Tests**: create/join reject blank names; trimmed name stored.

### Phase B — Round state on start (US2 + US3 backend)

6. **`game.ts`**: Add `drawerId`, `secretWord`, `scores` to `Room`; extend `RoomSnapshot`.
7. **`wordSelection.ts`**: `selectSecretWord(code: string): string` — sum char codes mod list length.
8. **`roomStore.ts` — `startGame`**: Set `drawerId = hostId`, `secretWord = selectSecretWord(code)`, init scores to 0.
9. **`toRoomSnapshot`**: Filter `secretWord` by viewer; omit `availableWords` when playing; include `drawerId`, `scores`.
10. **Tests**: same code → same word; guesser snapshot omits secret; drawer snapshot includes secret.

### Phase C — Frontend game experience (US2 + US3)

11. **`api.ts`**: Update `RoomSnapshot` type (`drawerId`, `scores`, optional `secretWord`; drop `availableWords` requirement when playing).
12. **`GamePage.tsx`**: ~2s polling; redirect if `status !== "playing"`; show drawer label; word panel for drawer only; hide for guessers.
13. **`Scoreboard.tsx`**: Read `room.participants` + `room.scores` from props/context.
14. **Canvas placeholder**: Show "You are drawing!" for drawer vs "Waiting for drawer…" for guessers.

### Phase D — Validation

15. Run [quickstart.md](./quickstart.md) two-tab checklist.
16. `npm test` + `npm run build` in both apps.

## Data Flow

```text
Create/Join → trim name → store participant
Start game  → drawerId, secretWord, scores=0, status=playing
GET snapshot(participantId):
  drawer  → includes secretWord
  guesser → no secretWord, no availableWords
GamePage  → poll 2s → update scoreboard + word panel
```

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| `availableWords` leaks answer | Omit from playing snapshots |
| Guesser reads word in DevTools | Server never sends `secretWord` for non-drawer |
| Empty name via API bypass | Zod + service-level guard |
| GamePage without poll loses word on refresh | Game polling in Phase C |

## Complexity Tracking

Empty — no constitution violations.

## Artifacts Generated

| Artifact | Path |
|----------|------|
| Research | [research.md](./research.md) |
| Data model | [data-model.md](./data-model.md) |
| API contract | [contracts/rooms-api.md](./contracts/rooms-api.md) |
| Quickstart | [quickstart.md](./quickstart.md) |

**Next command**: `/speckit-tasks`
