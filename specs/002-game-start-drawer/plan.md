# Implementation Plan: Game Start & Drawer Flow

**Feature**: Group 2 — Scenario 2 (Game Start & Drawer Flow)

**Branch**: `002-game-start-drawer` | **Date**: 2026-06-05 | **Spec**: [spec.md](./spec.md)

**Status**: Draft

**Constitution**: Compliant with `.specify/memory/constitution.md` — brownfield extension, HTTP polling
only, in-memory store, no auth, Zod at the boundary, deterministic game rules, server-side viewer
projection.

## Summary

Harden player-name validation (trim + reject empty/whitespace, no silent `"Player"` default), and on
game start assign the host the `drawer` role and all others `guesser`, deterministically select a
secret word from the starter list using `sum(code char codes) % wordList.length`, and project the
secret word **only** into the drawer's room snapshot (omitted entirely for guessers). Round
initialization runs inside the existing `startRoom` action when status first becomes `started`
(clarified); `GET /rooms/:code` stays a pure read/projection. Extends Group 1's model, store, schemas,
start route, snapshot projection, name handling, and the game page — no new dependencies, no rewrites.

> **Builds on Group 1**: `Room.hostId`, `status: "lobby" | "started"`, `startRoom()` discriminated
> result, viewer-aware `toRoomSnapshot(room, viewerParticipantId)`, lobby polling, and `/game`
> navigation already exist. Group 2 fills the `_viewerParticipantId` argument that Group 1 left
> forward-compatible.

## 1. Technical Context

### Tech stack (unchanged — no new dependencies)

| Layer | Technology |
|-------|------------|
| Frontend | React 18, React Router v6, Vite, TypeScript (strict) |
| Frontend state | Custom `RoomStore` via `useSyncExternalStore` (`frontend/src/state/roomStore.ts`) |
| Backend | Node.js, Express, TypeScript (ESM), `tsx` for dev |
| Validation | Zod (`backend/src/api/schemas.ts`) |
| Storage | In-memory `Map<string, Room>` (`backend/src/services/roomStore.ts`) |
| Sync | HTTP polling every ~2s (`GET /rooms/:code`) — reused from Group 1 |

**Target Platform**: Local dev — backend `http://localhost:3001`, frontend `http://localhost:5173`.

**Testing**: Extend existing `roomStore.test.ts`, `schemas.test.ts`, `api.test.ts`; add a pure unit
test for the word-selection function.

**Scale/Scope**: Classroom-scale rooms; many independent rooms in one process.

### Constraints (from constitution)

- **No WebSockets** — game-screen sync (Group 3) will reuse polling; this group only renders current snapshot state.
- **No database** — round state (roles, word) lives only in the in-memory `Map`.
- **No auth** — drawer identity is derived from `hostId`, not a credential.
- **Deterministic game rules** — word selection is a pure function of the room code; no `Math.random()`.
- **Validate at the boundary** — name validation enforced in Zod schemas; word hiding enforced server-side in the projection, not the UI.
- **Extend, don't replace** — reuse `startRoom`, `toRoomSnapshot`, existing schemas/routes/pages.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Gate | Status |
|-----------|------|--------|
| I. Extend, Don't Replace | Reuse Group 1 store/route/snapshot; no new deps; no unrelated refactor | PASS |
| II. Spec-Driven & Traceable | Every change maps to FR-020…FR-032 | PASS |
| III. Deterministic Game Rules | Word selection is a pure, unit-tested function of the room code | PASS |
| IV. Validation at Edge | Name trim/reject in Zod; secret-word hiding in server projection (not UI-only) | PASS |
| V. Stay In Scope | No drawing/guessing/scoring/results/restart; no game-screen polling beyond rendering snapshot | PASS |

No violations. Complexity Tracking omitted.

## 2. Findings (current state after Group 1)

| Finding | Evidence | Implication for Group 2 |
|---------|----------|-------------------------|
| Names silently default to "Player" | `roomStore.ts` `displayName(name) = name || "Player"`; `createRoomSchema`/`joinRoomSchema` use `z.string().optional()` | Make `playerName` required, trimmed, min-length 1 in Zod (FR-020/021) |
| Roles seeded but never assigned | `starterData.ts` `STARTER_ROLES`; `toRoomSnapshot` emits a static `roles` array | Assign per-participant role on start; expose role per participant (FR-023/024) |
| Word list present, never selected | `STARTER_WORDS`; snapshot emits static `availableWords` | Deterministically pick `secretWord` on start (FR-026) |
| Snapshot ignores viewer | `toRoomSnapshot(room, _viewerParticipantId)` — arg unused | Use viewer id to attach `secretWord` only for the drawer (FR-028/029/030) |
| `startRoom` sets status only | Group 1 `startRoom` flips `status` to `started`, no round state | Initialize roles + word inside the same success path (FR-025) |
| Game page is placeholder | `GamePage.tsx` static canvas; no role/word display | Show drawer identity for all; show word only to drawer (FR-031) |

## 3. State Model

### 3.1 Backend model changes (`backend/src/models/game.ts`)

Add round state to `Room` and a per-participant role + optional `secretWord` to the snapshot.

```typescript
export type ParticipantRole = "drawer" | "guesser";   // already exists

export interface Room {
  code: string;
  status: RoomStatus;                 // "lobby" | "started"
  hostId: string;
  participants: Participant[];
  round: RoundState | null;           // NEW — null while in lobby
  createdAt: string;
  updatedAt: string;
}

export interface RoundState {         // NEW — set once on start
  drawerId: string;                   // === hostId for this lab
  secretWord: string;                 // chosen deterministically from STARTER_WORDS
  roles: Record<string, ParticipantRole>; // participantId -> role
}

export interface SnapshotParticipant extends Participant {
  isHost: boolean;
  role: ParticipantRole | null;       // NEW — null while in lobby
}

export interface RoomSnapshot {
  code: string;
  status: RoomStatus;
  hostId: string;
  drawerId: string | null;            // NEW — who is drawing (null in lobby)
  participants: SnapshotParticipant[];
  availableWords: string[];
  roles: ParticipantRole[];
  secretWord?: string;                // NEW — present ONLY on the drawer's snapshot (omitted otherwise)
}
```

`secretWord` is **optional** so it can be omitted entirely for guessers (clarified — never `null`).

### 3.2 Backend logic changes

**`backend/src/services/wordSelection.ts` (NEW — pure, deterministic):**

```typescript
export function selectWord(code: string, words: readonly string[]): string {
  const sum = [...code].reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return words[sum % words.length];
}
```

Pure, no randomness, unit-testable (FR-026, Constitution III).

**`backend/src/services/roomStore.ts`:**

- **`displayName` / name handling**: stop defaulting to `"Player"`. Names are validated + trimmed at
  the Zod edge; the store stores the trimmed value it receives (FR-021).
- **`startRoom(code, participantId)`** (extend the existing success branch): on the *first* transition
  to `started`, build `round`:
  - `drawerId = room.hostId`
  - `roles = { [hostId]: "drawer", ...others: "guesser" }`
  - `secretWord = selectWord(room.code, STARTER_WORDS)`
  - Idempotent: if already `started`, return the existing room/round unchanged (clarified).
- **`toRoomSnapshot(room, viewerParticipantId)`**: now consumes the viewer id:
  - `drawerId = room.round?.drawerId ?? null`
  - each participant gets `role = room.round?.roles[p.id] ?? null`
  - attach `secretWord` **only** when `room.round && viewerParticipantId === room.round.drawerId`;
    otherwise the field is absent from the object (FR-028/029/030).

### 3.3 Backend validation changes (`backend/src/api/schemas.ts`)

Replace optional name with a required, trimmed, non-empty name shared by create + join:

```typescript
const playerNameSchema = z
  .string()
  .transform((s) => s.trim())
  .pipe(z.string().min(1, "Player name is required"));

export const createRoomSchema = z.object({ playerName: playerNameSchema });
export const joinRoomSchema   = z.object({ playerName: playerNameSchema });
```

Invalid names → existing `errorHandler` returns `400 { "message": "Invalid request payload" }`
(Zod). (FR-020)

### 3.4 Frontend changes

- **`frontend/src/services/api.ts`**: mirror snapshot type — add `drawerId: string | null`,
  `role` on participants, optional `secretWord?: string`.
- **`frontend/src/state/roomStore.ts`**: mirror the type (no new action needed — `startGame()` and
  `fetchRoom()` already carry the viewer id; the drawer's polled snapshot will include `secretWord`).
- **`frontend/src/pages/CreateRoomPage.tsx` / `JoinRoomPage.tsx`**: block submit on empty/whitespace
  name with a visible message before calling the server (FR-022). (Group 1 deferred this here.)
- **`frontend/src/pages/GamePage.tsx`**: show the drawer's name to everyone; if the current viewer is
  the drawer, show the secret word; guessers see a "guess the word" prompt instead (FR-031).

## 4. Data Flow

### 4.1 Create / Join with name validation

`CreateRoomPage`/`JoinRoomPage` trim the name and block empty submits client-side (FR-022). Server
re-validates via Zod (`min(1)` after trim); empty/whitespace → `400`, no room mutation (FR-020/021).

### 4.2 Start → round initialization (single operation)

Host clicks Start → `POST /rooms/:code/start { participantId }` → `startRoom` validates host + ≥2
players (Group 1) → on first success, sets `status = "started"` **and** builds `round` (drawer, roles,
word) in the same operation (FR-025) → returns the host/drawer's snapshot (includes `secretWord`).

### 4.3 Snapshot projection (drawer vs guesser)

`GET /rooms/:code?participantId=X` → `toRoomSnapshot(room, X)`:
- All viewers: `drawerId`, and `role` on each participant.
- If `X === round.drawerId`: snapshot includes `secretWord`.
- Else: `secretWord` key is absent (FR-029). Guessers poll and render drawer identity but never the word.

### 4.4 Game screen rendering

Non-host tabs already auto-navigate to `/game` when polling sees `status === "started"` (Group 1).
On `/game`, each client reads its own latest snapshot: the drawer sees the word; guessers see who the
drawer is and a waiting/guess prompt. No new polling logic is added in this group.

## 5. File-Level Plan

### Backend

| File | Change |
|------|--------|
| `backend/src/models/game.ts` | Add `round: RoundState \| null` to `Room`; add `RoundState`; add `role` to snapshot participant and `drawerId` + optional `secretWord` to `RoomSnapshot` |
| `backend/src/services/wordSelection.ts` | **NEW** — pure `selectWord(code, words)` (sum of char codes % length) |
| `backend/src/services/roomStore.ts` | Initialize `round` in `startRoom` success; drop `"Player"` default; viewer-aware `toRoomSnapshot` (role per participant, `secretWord` only for drawer) |
| `backend/src/api/schemas.ts` | Require trimmed, non-empty `playerName` in create/join schemas |
| `backend/src/api/rooms.ts` | No new route; start/get already exist — behavior change flows through store + schema |
| `backend/src/services/wordSelection.test.ts` | **NEW** — determinism + in-list + distribution sanity |
| `backend/src/services/roomStore.test.ts` | Drawer/roles on start; idempotent round; word hidden for guesser, shown for drawer; isolation |
| `backend/src/api/schemas.test.ts` | Reject empty/whitespace name; trim accepted name |

### Frontend

| File | Change |
|------|--------|
| `frontend/src/services/api.ts` | Extend `RoomSnapshot`/participant type: `drawerId`, `role`, optional `secretWord` |
| `frontend/src/state/roomStore.ts` | Mirror snapshot type (no new action) |
| `frontend/src/pages/CreateRoomPage.tsx` | Block empty/whitespace name before request (FR-022) |
| `frontend/src/pages/JoinRoomPage.tsx` | Add empty/whitespace name guard alongside existing code guard (FR-022) |
| `frontend/src/pages/GamePage.tsx` | Show drawer name to all; show `secretWord` only when viewer is drawer (FR-031) |
| `frontend/src/services/api.test.ts` | (Optional) assert snapshot type usage stays correct |

## 6. API Contract (Group 2)

See [contracts/rooms-api.md](./contracts/rooms-api.md). Summary of changes vs Group 1:

- **`POST /rooms` / `POST /rooms/:code/join`**: `playerName` now required + trimmed; empty → `400`.
- **`POST /rooms/:code/start`**: on success now also sets `round` (drawer, roles, word). Response is
  the requester's projection (host = drawer → includes `secretWord`).
- **`GET /rooms/:code?participantId=`**: snapshot gains `drawerId` and per-participant `role`;
  includes `secretWord` only when the requester is the drawer.

Unchanged route paths; existing `HttpError` + `errorHandler` for messages.

## 7. Implementation Sequence

Each step is a candidate for one granular, traceable commit (Scenario 2).

1. **Model** — add `round`/`RoundState`; extend snapshot (`drawerId`, participant `role`, optional `secretWord`).
2. **Word selection** — pure `selectWord` + unit test (Constitution III).
3. **Store (round init)** — initialize `round` in `startRoom`; idempotent; unit tests.
4. **Store (projection)** — viewer-aware `toRoomSnapshot` (roles + drawer-only word); tests for hide/show + isolation.
5. **Name validation** — required/trimmed Zod schemas; drop `"Player"` default; schema tests.
6. **Frontend types** — mirror snapshot in `api.ts` + `roomStore.ts`.
7. **Frontend name guards** — block empty/whitespace name on create + join.
8. **Game screen** — drawer identity for all; word only for drawer.
9. **Validate** — two browser tabs (drawer vs guesser) per [quickstart.md](./quickstart.md); `npm test` + `npm run build`.

## 8. Testing Strategy

### Automated

- **`wordSelection.test.ts`**: same code → same word; selected word always in list; different codes can map to different words.
- **`roomStore.test.ts`**: start assigns host=`drawer`, others=`guesser`; `round` is idempotent on re-start; drawer snapshot includes `secretWord`, guesser snapshot omits it; starting room A does not create round state in room B.
- **`schemas.test.ts`**: create/join reject empty + whitespace-only names; accepted names are trimmed.

### Manual (two browser tabs — constitution quality gates)

1. Create with `"   "` name → rejected with a message; with `"  Ada "` → joins as `Ada`.
2. Host + 1 joiner, host starts → both land on `/game`.
3. Host/drawer tab shows the secret word and is labeled drawer.
4. Joiner/guesser tab shows who the drawer is and does **not** show the word (verify in UI and network response).
5. Re-fetch both tabs → drawer still sees word, guesser still does not.
6. Second parallel room → independent word/drawer, no cross-room leakage.

## 9. Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Word leaks to guessers via shared snapshot | Enforce omission in `toRoomSnapshot` using viewer id; unit test guesser snapshot has no `secretWord` key (FR-029/030) |
| Name validation breaks existing tests/UX | Update create/join schema + tests together; client guard mirrors server; trimmed value stored |
| Non-deterministic word (accidental `Math.random`) | Pure `selectWord(code)`; unit test pins determinism (Constitution III) |
| Round re-initialized on repeated start | Initialize only when `round` is null / first `started` transition; idempotent test |
| TS strict breakage from optional `secretWord` | Use `secretWord?: string` and conditional spread; no `any` |
| Scope creep into guessing/scoring | FR-032 guard: no drawing/guess/score/result/restart here |

## 10. Out of Scope

Per constitution §V and spec FR-032: drawing/canvas strokes, clear canvas, guess submission and
history, scoring, result state, restart, game-screen gameplay polling, WebSockets, databases, auth,
timers, multiple rounds, drawer rotation, custom/random word packs, new libraries, unrelated refactors.

## Implementation Notes & Deviations (post-execution)

Recorded per constitution Principle II (traceability):

- **Supersedes Group 1 FR-018**: Group 1's `startRoom` test asserted "no role or word" on start. Group 2
  intentionally changes this — `startRoom` now assigns roles and selects the word. The Group 1 test was
  updated to keep only the status/idempotency assertions; round-state assertions live in the Group 2
  tests (T015/T016/T020/T021).
- **I1 decision (from `/speckit-analyze`)**: Kept the generic Zod `400 { "message": "Invalid request
  payload" }` for empty names server-side; the clear, name-specific message is shown client-side (FR-022),
  consistent with Group 1. No `errorHandler` change.
- **`createRoom`/`joinRoom` signatures** narrowed from `playerName?: string` to `playerName: string`
  since the Zod edge now guarantees a trimmed non-empty name; the `"Player"` default was removed.
- **GamePage**: drawer sees the secret word and a "you are the drawer" line; guessers see the drawer's
  name and a guess prompt. Canvas remains a placeholder (drawing is Group 3, FR-032).
- **T031/T026 (CSS)**: No new styles required — existing `status-line`/`form__error` classes covered the
  drawer/word display.

## Project Structure (documentation)

```text
specs/002-game-start-drawer/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/rooms-api.md  # Phase 1 output
├── checklists/requirements.md
└── tasks.md             # /speckit-tasks (next)
```
