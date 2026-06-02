# Implementation Plan: Room Setup & Lobby

**Branch**: `001-room-setup-lobby` | **Date**: 2026-06-02 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-room-setup-lobby/spec.md`

## Summary

Extend the starter's room API and lobby UI so the creator is tracked as host, the
lobby auto-polls (~2s), Start is gated to host + ≥2 players, and the host's
identity survives a browser refresh via local storage keyed by room code.
No new top-level dependencies; pure brownfield extension of existing files.

Primary technical levers:

- Add `hostParticipantId` to the `Room` model and `RoomSnapshot`.
- Tighten room-code generation from the starter's 32-char alphabet to A–Z per the
  spec clarification (FR-002).
- Tighten Zod schemas at request boundaries (FR-005/006/015 — clear errors on
  empty / whitespace-only code, "Room not found" on unknown code).
- Add a `useLobbyPolling(roomCode)` hook in `frontend/src/state/` that drives a
  2-second `setInterval` and cleans up on unmount (FR-009/010, Constitution §IV).
- Persist `{participantId, roomCode}` in `localStorage` at create/join time; on
  Lobby mount, if the snapshot's `hostParticipantId` matches the stored
  `participantId`, render host UI (Start button) — otherwise render guest UI.
- Fix the pre-existing sabotage in `frontend/src/services/api.ts` line 22 where
  the `VITE_API_URL` fallback is `"http://localhost:3001/bug"` instead of
  `"http://localhost:3001"`; nothing else works until this is corrected.

## Technical Context

**Language/Version**: TypeScript 5.6, Node.js 18+, ES Modules
**Primary Dependencies**: Express 4, Zod 3 (backend); React 18, React Router 6,
Vite 5 (frontend). No additions.
**Storage**: In-memory `Map<string, Room>` on the backend (existing). Client-side
identity stored in browser `localStorage`.
**Testing**: Vitest 3 in both `backend/` and `frontend/`; jsdom on the frontend.
Test files live next to the unit under test (`*.test.ts`/`*.test.tsx`).
**Target Platform**: localhost development on macOS/Linux/Windows; modern
evergreen browser (Chrome/Safari/Firefox current).
**Project Type**: Web application — `backend/` (Express API) + `frontend/`
(Vite/React SPA).
**Performance Goals**: Lobby polling target 2000 ms (Constitution Principle IV);
participant addition visible to all viewers within 3 s (Spec SC-003).
**Constraints**: No DB, no WebSockets, no auth/sessions, no new top-level
dependencies (Constitution Principle II + Technology & Scope Constraints).
Strict TS; no `any`. All request/response payloads validated with Zod at the
boundary.
**Scale/Scope**: Lab-scale — a handful of concurrent rooms each with a handful
of participants. No load targets.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Concrete gates derived from the constitution:

| # | Gate | Source | Status (Phase 0) | Status (Phase 1) |
|---|---|---|---|---|
| G1 | Every planned change traces to a US/FR/SC | Principle I | PASS — all changes map to US1–US4, FR-001…FR-015, SC-001…SC-006 | PASS |
| G2 | No out-of-scope items present (WS, DB, auth, persistence, timers, libs) | Principle II + Tech & Scope | PASS — none introduced | PASS |
| G3 | No new top-level deps | Principle II | PASS — Express, Zod, React, Router, Vite only | PASS |
| G4 | All API boundaries Zod-validated; no `any` | Principle III | PASS — schemas tightened in Phase 1 contracts | PASS |
| G5 | Deterministic / observable behavior across clients | Principle IV | PASS — polling interval fixed; code generation A–Z; isolation by Map key | PASS |
| G6 | Self-review hooks in place (granular commits per US, two-tab gate, both builds) | Principle V | PASS — see Phase 2 task plan | PASS |

No violations → Complexity Tracking is empty (see end of file).

## Project Structure

### Documentation (this feature)

```text
specs/001-room-setup-lobby/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (3 endpoint contracts)
│   ├── POST_rooms.md
│   ├── POST_rooms_code_join.md
│   └── GET_rooms_code.md
├── checklists/
│   └── requirements.md  # (already exists from /speckit-specify)
└── tasks.md             # Phase 2 output (created later by /speckit-tasks)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── api/
│   │   ├── rooms.ts          # MODIFY — surface hostParticipantId, tighter errors
│   │   ├── router.ts         # (unchanged)
│   │   ├── schemas.ts        # MODIFY — non-empty room code, normalized casing
│   │   └── schemas.test.ts   # MODIFY — cover empty/whitespace rejection
│   ├── models/
│   │   └── game.ts           # MODIFY — add hostParticipantId to Room + RoomSnapshot
│   ├── services/
│   │   ├── roomStore.ts      # MODIFY — A–Z codes, set hostParticipantId, expose in snapshot
│   │   └── roomStore.test.ts # MODIFY — assert A–Z code regex, host assignment, isolation
│   ├── seed/starterData.ts   # (unchanged)
│   ├── app.ts                # (unchanged)
│   └── server.ts             # (unchanged)
└── package.json              # (unchanged — no new deps)

frontend/
├── src/
│   ├── services/
│   │   ├── api.ts            # MODIFY — FIX sabotaged base URL; type hostParticipantId
│   │   └── api.test.ts       # MODIFY — assert correct base URL, hostParticipantId carried through
│   ├── state/
│   │   ├── roomStore.ts      # MODIFY — set/restore identity from localStorage; expose isHost selector
│   │   └── useLobbyPolling.ts # NEW — 2s polling hook with clean unmount
│   ├── pages/
│   │   ├── CreateRoomPage.tsx # MODIFY — write identity to localStorage on success
│   │   ├── JoinRoomPage.tsx   # MODIFY — write identity to localStorage on success; render rejection messages
│   │   └── LobbyPage.tsx      # MODIFY — wire polling, host-only Start, 2-player gate, remove manual refresh button
│   └── components/
│       └── RoomCodeBadge.tsx  # (unchanged — already renders code)
└── package.json               # (unchanged — no new deps)
```

**Structure Decision**: Web app layout (frontend + backend) per the starter.
All changes are file-level edits inside that existing tree; no new top-level
directories or packages are introduced. The new file `useLobbyPolling.ts` is a
local hook beside `roomStore.ts`, not a new package.

## Phase 0 — Outline & Research

See [research.md](./research.md). Summary of decisions resolved there:

- **Polling implementation**: plain `setInterval` inside a React `useEffect`
  with a single `clearInterval` cleanup. No `setTimeout` recursion, no
  AbortController for the fetch itself (errors set into store; next interval
  retries naturally).
- **Identity persistence**: `localStorage` only; key
  `scribble:identity:<roomCode>`; value `{participantId, role}`. No
  `sessionStorage` (lost on tab close, defeats refresh resilience). No cookies.
- **Host assignment**: server-side and authoritative; the `participantId`
  returned at room creation is recorded in `Room.hostParticipantId`. The
  frontend computes `isHost = snapshot.hostParticipantId === local.participantId`.
- **Code generation**: 26-letter A–Z, 4-character codes, `Math.random()` per
  character with a uniqueness check against the active `Map`. Pure identifier;
  no determinism requirement.
- **Error UX**: server returns `{message: string}` for every error; client
  surfaces that string in `form__error` text under the relevant field.
- **Polling cadence under tab background**: rely on browser-default throttling;
  no special handling. Visible behavior on a foreground tab meets SC-003.

## Phase 1 — Design & Contracts

See [data-model.md](./data-model.md) and [contracts/](./contracts/) and
[quickstart.md](./quickstart.md).

Phase 1 artifacts:

- `data-model.md` — `Room`, `Participant`, `RoomSnapshot` with the
  `hostParticipantId` extension; `LocalIdentity` for the frontend.
- `contracts/POST_rooms.md`, `contracts/POST_rooms_code_join.md`,
  `contracts/GET_rooms_code.md` — request/response shapes and the full error
  matrix (400/404).
- `quickstart.md` — exact two-tab validation steps tied to US1–US4 and SC-001
  through SC-006.
- Agent context refreshed at the end of Phase 1: `CLAUDE.md` plan reference
  updated to point at this file.

## Data Flow Summary

```text
Create:
  CreateRoomPage --POST /rooms {playerName}--> rooms.ts (Zod) --> roomStore.createRoom
    -> new participant + new Room { hostParticipantId = participant.id }
    -> 201 { participantId, room: snapshot(hostParticipantId) }
    -> CreateRoomPage writes localStorage["scribble:identity:CODE"] = {participantId, role:"host"}
    -> navigate /lobby

Join:
  JoinRoomPage --POST /rooms/:code/join {playerName}--> rooms.ts (Zod + normalize)
    -> roomStore.joinRoom(code.toUpperCase()) -> appends participant or null
    -> 200 { participantId, room: snapshot } | 404 { message }
    -> JoinRoomPage writes localStorage["scribble:identity:CODE"] = {participantId, role:"guest"}
    -> navigate /lobby

Lobby (mount):
  LobbyPage reads localStorage["scribble:identity:<roomCode>"]
    -> if absent: back to "/" (route guard)
    -> if present: store.hydrate({participantId, roomCode})
  useLobbyPolling(roomCode) -> setInterval(2000) -> store.fetchRoom()
    -> GET /rooms/:code -> 200 { room: snapshot }
    -> snapshot delivers latest participants[] + hostParticipantId
  Render:
    -> isHost := snapshot.hostParticipantId === participantId
    -> Start visible only when isHost
    -> Start enabled only when participants.length >= 2
  Unmount: clearInterval; no further requests
```

## Implementation Sequence (high-level — full task list comes from /speckit-tasks)

1. **Fix sabotaged base URL** in `frontend/src/services/api.ts` (blocker; otherwise nothing reaches the backend).
2. **Backend host model**: extend `Room`, `RoomSnapshot`, `roomStore` to track and expose `hostParticipantId`; tighten code alphabet to A–Z; update `roomStore.test.ts`.
3. **Backend validation**: tighten `schemas.ts` for non-empty, whitespace-trimmed room code; ensure clear `message` strings; add `schemas.test.ts` cases.
4. **Frontend identity persistence**: `localStorage` helper, integrate into `CreateRoomPage` and `JoinRoomPage`, and into `LobbyPage` mount.
5. **Frontend polling**: implement `useLobbyPolling`; wire into `LobbyPage`; remove the manual Refresh button.
6. **Frontend host UI**: derive `isHost`; gate Start visibility; gate Start enabling by participant count; render "Waiting for another player" message when alone.
7. **Validation**: run both `npm run build`s; run both `npm test`s; perform the two-tab walkthrough from `quickstart.md`.

## Risks

| # | Risk | Likelihood | Mitigation |
|---|---|---|---|
| R1 | Sabotaged base URL hides downstream errors as 404s | High | Fix first; verify `/health` reachable before any other work |
| R2 | Existing `playerName: z.string().optional()` lets empty names create rooms (Scenario 2 territory) | Medium | Leave alone for this feature; document in spec assumptions; flag for Scenario 2 |
| R3 | `localStorage` unavailable (private mode, locked-down browser) | Low | Wrap reads/writes in try/catch; on failure, in-memory identity only (host loses role on refresh, room continues) |
| R4 | Background-tab `setInterval` throttling delays polling | Low | Acceptable for lab; SC-003 tested on foreground tabs only |
| R5 | Concurrent polls racing with a join | Low | Server returns full snapshot on each GET; idempotent; last-write-wins is harmless for a participant list |
| R6 | Existing test asserts `/^[A-Z0-9]{4}$/`; tightening to A–Z without updating the test breaks CI | High | Update `roomStore.test.ts` in the same commit that tightens generation |

## Testing Strategy

- **Backend unit (Vitest)**: room store host assignment, A–Z code regex, multi-room isolation, snapshot shape; schema acceptance/rejection for empty + whitespace-only codes and missing payload fields.
- **Frontend unit (Vitest + jsdom)**: api base URL fix, identity helper read/write, `useLobbyPolling` mount/unmount behavior with a fake timer, `LobbyPage` host-vs-guest UI given a stubbed snapshot.
- **Two-tab acceptance (manual)**: the walkthrough in `quickstart.md`, covering US1, US2, US3, US4, and the cross-room isolation case.
- **Build gate**: `cd backend && npm run build` and `cd frontend && npm run build` both succeed before opening PR (Constitution Principle V).

## Complexity Tracking

> Fill ONLY if Constitution Check has violations that must be justified

No violations — nothing to track.
