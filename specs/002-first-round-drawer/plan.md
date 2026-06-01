# Implementation Plan: First Round Drawer and Secret Word

**Branch**: `002-first-round-drawer` | **Date**: 2026-06-01 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-first-round-drawer/spec.md`

## Summary

On host start from lobby, validate all participant names (trim, reject empty), transition to **round one** (`drawing` status), assign **host as drawer** (else earliest joiner), select **secret word deterministically** from `STARTER_WORDS`, and expose word **only to drawer** in viewer-scoped snapshots. Brownfield: extend `roomStore`, `game.ts`, `POST /rooms/:code/start`, and `GamePage`.

## Technical Context

**Language/Version**: TypeScript (Node backend, React 18 frontend)  
**Primary Dependencies**: Express, Zod, React Router v6, Vite  
**Storage**: In-memory `roomStore` (no database)  
**Testing**: `roomStore.test.ts`, `rooms.test.ts` (test-first per constitution)  
**Target Platform**: Local dev, two-browser manual verify  
**Project Type**: Web monorepo `backend/` + `frontend/`  
**Constraints**: No WebSockets, no auth, no DB; deterministic word selection (no `Math.random` for word pick)  
**Scale/Scope**: Round 1 only; depends on `001-host-join-rooms` lobby start gate

## Constitution Check

*GATE: Pass*

| Principle | Compliance |
|-----------|------------|
| I. Type Safety | Typed `Round`, roles, viewer snapshot fields |
| II. Modular Architecture | `wordSelection` service; API → roomStore → models |
| III. AI Discipline | Reuse `STARTER_WORDS` from `starterData.ts` |
| IV. Quality Gates | Build, test, two-tab game screen verify |
| V. Testing | Unit tests for trim, drawer, deterministic word, viewer word leak |
| Game Logic | Name trim; host drawer; deterministic word from seed list |

## Project Structure

### Documentation (this feature)

```text
specs/002-first-round-drawer/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/game-start-api.md
└── tasks.md
```

### Source Code

```text
backend/src/
├── api/rooms.ts, schemas.ts
├── models/game.ts
├── services/roomStore.ts
├── services/wordSelection.ts   (new)
└── seed/starterData.ts

frontend/src/
├── pages/GamePage.tsx, LobbyPage.tsx
├── state/roomStore.ts
└── services/api.ts
```

## Gap Analysis (post-001 / starter)

| Requirement | Current state | Action |
|-------------|---------------|--------|
| FR-001–003 Name at start | Trim on create/join only | Validate all participants in `startGame` |
| FR-004 Start → round 1 | No start endpoint / status stuck lobby | `startGame` → `drawing`, round index 1 |
| FR-005–008 Drawer | No roles on participants | Set `drawerParticipantId`; expose role in snapshot |
| FR-006 Host drawer | No host field | Use `hostParticipantId` from 001 |
| FR-009 Deterministic word | `availableWords` listed to all | `selectWord(roomCode, round)` hash only |
| FR-010–011 Word visibility | No per-viewer word | `secretWord` in snapshot only for drawer viewer |
| FR-012 Guesser UX | Generic “Playing” | Guesser prompt without word; drawer label |

## Implementation Sequence

1. **Models**: `drawing` status, `RoundState`, participant `role`, `drawerParticipantId`, viewer `role` + optional `secretWord`.
2. **wordSelection.ts**: Pure `selectRoundWord(roomCode, roundNumber)` → index into `STARTER_WORDS`.
3. **startGame**: Name sweep, assign drawer, set word, transition status.
4. **toRoomSnapshot**: Viewer-scoped fields; never leak `secretWord` to guessers.
5. **Tests**: Determinism, drawer=host, guesser no word.
6. **Frontend**: GamePage shows drawer/guesser labels; word panel drawer-only; navigate on start from lobby.

## Testing Strategy

- **Unit**: `wordSelection`, `startGame` drawer/word/validation.
- **Contract**: `POST /start` response shape; GET game snapshot drawer vs guesser.
- **Manual**: Two browsers—host sees word, guest does not; repeat start test for determinism.

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| 001 not merged | Document dependency; implement against planned 001 fields |
| Word leaked in JSON | Contract test asserts guesser payload has no `secretWord` |
| Host absent edge | Fallback to earliest `joinedAt` per FR-007 |

## Complexity Tracking

No constitution violations.
