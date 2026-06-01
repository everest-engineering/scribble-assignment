# Implementation Plan: Host and Join Game Rooms

**Branch**: `001-host-join-rooms` | **Date**: 2026-06-01 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-host-join-rooms/spec.md`

## Summary

Implement multiplayer **room create/join**, **host-only start** with a 2-player minimum, **lobby polling (~2s)**, **room isolation**, and **lifecycle rules** (10-player cap, disconnect pruning, empty-room deletion, no join after start). Brownfield: extend existing Express `roomStore` and React `roomStore`/`LobbyPage` rather than replace.

## Technical Context

**Language/Version**: TypeScript (Node backend, React 18 frontend)  
**Primary Dependencies**: Express, Zod, React Router v6, Vite  
**Storage**: In-memory `Map` in `roomStore` (no database)  
**Testing**: Node test runner / existing backend test pattern (`roomStore.test.ts`)  
**Target Platform**: Local dev browsers + Node server  
**Project Type**: Web (monorepo `backend/` + `frontend/`)  
**Performance Goals**: Lobby poll ~2s; API responses &lt;200ms local  
**Constraints**: No WebSockets, no auth, no DB (AGENTS.md + constitution)  
**Scale/Scope**: ≤10 participants/room; 4-char room codes

## Constitution Check

*GATE: Pass (pre and post design)*

| Principle | Compliance |
|-----------|------------|
| I. Type Safety | Extend `Room`, `RoomSnapshot`, Zod schemas explicitly—no `any` |
| II. Modular Architecture | API → services → models; UI via `roomStore` + pages |
| III. AI Discipline | No new forbidden deps |
| IV. Quality Gates | Build, lint, tests, two-tab manual verify per quickstart |
| V. Testing | Contract + unit tests before/alongside implementation |
| Game Logic | Name trim/reject on server; deterministic room rules |

**Post-design**: No violations. Disconnect timeout is operational, not game randomness.

## Project Structure

### Documentation (this feature)

```text
specs/001-host-join-rooms/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/rooms-api.md
└── tasks.md
```

### Source Code

```text
backend/src/
├── api/rooms.ts, schemas.ts
├── models/game.ts
└── services/roomStore.ts

frontend/src/
├── pages/CreateRoomPage.tsx, JoinRoomPage.tsx, LobbyPage.tsx
├── state/roomStore.ts
└── services/api.ts
```

**Structure Decision**: Use existing layout; add `start` route handler and lobby poll hook only where needed.

## Gap Analysis (starter vs spec)

| Requirement | Starter state | Action |
|-------------|---------------|--------|
| FR-002 Host | No `hostParticipantId` | Add field; set on create |
| FR-006 Name validation | Optional name → `"Player"` | Trim + reject empty (API + forms) |
| FR-008 Lobby polling | Manual refresh only | `useEffect` interval 2000ms |
| FR-009–011 Start | Any user → `/game` | `POST /start`; host + ≥2; hide for guests |
| FR-015 No join in drawing | Only `lobby` status exists | Reject join when `status === "drawing"`; `result` join deferred to 004 |
| FR-016–017 Empty/disconnect | Participants never removed | `lastSeenAt` + prune on read |
| FR-018 Resume | `participantId` query ignored | Re-bind participant on GET |
| FR-019 Cap 10 | Unlimited | Enforce on join |
| FR-012–013 UI | No host label / weak code display | T035 prominent room code; T036 participant list; T014 host badge |
| SC-004 Poll | Manual | Auto poll |

## Implementation Sequence

1. **Models + service core**: `hostParticipantId`, `lastSeenAt`, trim helpers, `pruneStaleParticipants`, `join` guards (404/409), max 10, delete empty room.
2. **API**: Extend Zod schemas; map errors to 400/404/409; `toRoomSnapshot` viewer flags; `POST .../start`.
3. **Tests**: `roomStore.test.ts` for host, cap, prune, start gate, name trim (test-first per constitution).
4. **Frontend API client**: `startGame`, typed errors; sessionStorage session helper.
5. **LobbyPage**: 2s poll; host-only Start wired to API; disable start when `!canStart`; prominent room code (FR-012); full participant list (FR-013); host badge.
6. **Create/Join pages**: Client-side trim validation messages aligned with server.
7. **Manual validation**: [quickstart.md](./quickstart.md) two-browser pass.

## Testing Strategy

- **Unit**: `roomStore`—create host, join isolation, full room, started room join fail, prune removes idle, room deleted when empty.
- **Contract**: Supertest or fetch tests on routes—status codes and snapshot shape.
- **Manual**: Two tabs per constitution; verify SC-004 timing with guest join.

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Refresh drops host before prune | 30s `lastSeenAt` grace; GET refresh on lobby mount |
| Poll storms | Single interval per lobby mount; clear on unmount |
| Duplicate participants on resume | GET with same `participantId` updates `lastSeenAt` only—no duplicate push |

## Complexity Tracking

No constitution violations requiring justification.
