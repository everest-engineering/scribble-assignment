# Implementation Plan: First Round — Drawer Assignment and Secret Word

**Branch**: `scribble-lab` | **Date**: 2026-06-02 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/002-first-round-drawer/spec.md`

---

## Summary

When the host starts the game, the `startRoom` handler sets `drawerId = hostId` and `currentWord = STARTER_WORDS[0]` on the Room. The `toRoomSnapshot` projection already accepts a `viewerParticipantId`; it is extended to include `currentWord` only when the viewer is the drawer, returning `null` for all other viewers. On the frontend, `GamePage` gains session restore (for page-refresh survival) and derives drawer identity and word visibility from the updated snapshot. No new endpoints, no new libraries.

---

## Technical Context

**Language/Version**: TypeScript 5.x — Node.js 18+ (backend), browser (frontend)

**Primary Dependencies**: Backend: Express, Zod; Frontend: React 18, React Router, Vite

**Storage**: In-memory `Map<string, Room>` — no database (by design)

**Testing**: No test framework configured in starter; manual validation via quickstart.md

**Target Platform**: Node.js 18+ HTTP server + modern browser (Chrome/Firefox/Safari)

**Project Type**: Web application — separate `backend/` and `frontend/` directories

**Performance Goals**: Game screen reflects drawer identity and word within 1 second of game becoming active; session restore completes within 1 second of page refresh

**Constraints**: No WebSockets; polling only; in-memory store only; no new libraries; no randomness in word selection; `STARTER_WORDS[0]` = `"rocket"` always

**Scale/Scope**: Small multi-player session; single active round per room

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Brownfield-First | ✅ Pass | Extending existing `Room`, `RoomSnapshot`, `toRoomSnapshot`, `startRoom`, and `GamePage`; no rewrites |
| II. Spec Kit Traceability | ✅ Pass | spec.md, research.md, data-model.md, contracts/, quickstart.md all committed before implementation |
| III. Incremental Validation | ✅ Pass | Feature 001 validated before starting this feature; quickstart.md defines 9-check validation gate |
| IV. Scope Discipline | ✅ Pass | No rotation, no timers, no canvas, no scoring; single-round only; `STARTER_WORDS[0]` not random |
| V. AI Review Discipline | ✅ Pass | All generated code must be reviewed before commit |

No violations. No Complexity Tracking entries required.

---

## Project Structure

### Documentation (this feature)

```text
specs/002-first-round-drawer/
├── plan.md              ← this file
├── research.md          ← Phase 0 decisions
├── data-model.md        ← entity changes
├── quickstart.md        ← manual validation guide (9 checks)
├── contracts/
│   └── api.md           ← updated RoomSnapshot shape
└── checklists/
    └── requirements.md
```

### Source Code

```text
backend/
└── src/
    ├── models/
    │   └── game.ts              ← add drawerId + currentWord to Room and RoomSnapshot
    ├── services/
    │   └── roomStore.ts         ← init drawerId/currentWord null; set on startRoom; expose in toRoomSnapshot
    └── api/
        └── rooms.ts             ← set drawerId + currentWord in startRoom handler

frontend/
└── src/
    ├── services/
    │   └── api.ts               ← add drawerId + currentWord to RoomSnapshot interface
    └── pages/
        └── GamePage.tsx         ← session restore; derive isDrawer; show word to drawer, hidden to guesser
```

**Structure Decision**: Web application layout. Only the five files listed above require changes; all other starter files remain untouched.

---

## Implementation Sequence

Work through these slices in order. Validate each slice before moving to the next.

### Slice 1 — Backend: Extend Room and RoomSnapshot Models

**File**: `backend/src/models/game.ts`

- Add `drawerId: string | null` to `Room` interface.
- Add `currentWord: string | null` to `Room` interface.
- Add `drawerId: string | null` to `RoomSnapshot` interface.
- Add `currentWord: string | null` to `RoomSnapshot` interface.

**Validate**: `npm run build` in `backend/` — zero TypeScript errors.

---

### Slice 2 — Backend: Persist Drawer and Word in roomStore

**File**: `backend/src/services/roomStore.ts`

- In `createRoom`, initialize `drawerId: null` and `currentWord: null` on the new Room.
- In `toRoomSnapshot(room, viewerParticipantId?)`:
  - Include `drawerId: room.drawerId`.
  - Include `currentWord: viewerParticipantId === room.drawerId ? room.currentWord : null`.

**Validate**: `POST /rooms` response includes `"drawerId": null` and `"currentWord": null`. `npm run build` passes.

---

### Slice 3 — Backend: Set Drawer and Word on Game Start

**File**: `backend/src/api/rooms.ts`

- In the `startRoom` handler, after setting `room.status = "active"`, also set:
  - `room.drawerId = room.hostId`
  - `room.currentWord = STARTER_WORDS[0]`  (import `STARTER_WORDS` from `"../seed/starterData.js"`)

**Validate**:
- `POST /rooms/:code/start` (host's participantId) → response includes `"drawerId": "<hostId>"` and `"currentWord": "rocket"`.
- `GET /rooms/:code?participantId=<hostId>` → `"currentWord": "rocket"`.
- `GET /rooms/:code?participantId=<guestId>` → `"currentWord": null`.

---

### Slice 4 — Frontend: Update RoomSnapshot Type

**File**: `frontend/src/services/api.ts`

- Add `drawerId: string | null` to the `RoomSnapshot` interface.
- Add `currentWord: string | null` to the `RoomSnapshot` interface.

**Validate**: `npm run build` in `frontend/` — zero TypeScript errors.

---

### Slice 5 — Frontend: GamePage — Session Restore, Drawer Identity, Word Visibility

**File**: `frontend/src/pages/GamePage.tsx`

**Session restore** (SC-005):
- Add a `useRef(false)` guard `sessionRestoreAttempted`.
- On mount (with `room === null`): if guard not yet set, call `roomStore.restoreSession()`. If `!restored` or the restored room's `status !== "active"`, navigate to `/`.
- This mirrors the pattern in `LobbyPage.tsx`.

**Drawer identity** (FR-001, FR-002):
- Derive `isDrawer = participantId !== null && room.drawerId === participantId`.
- Find the drawer participant: `room.participants.find(p => p.id === room.drawerId)`.
- Display the drawer's name clearly to all players (e.g., a labelled card: "Alice is drawing").
- Display the viewer's own role: "You are drawing" if `isDrawer`, "You are guessing" if not.

**Word visibility** (FR-004, FR-005):
- If `isDrawer` and `room.currentWord` is not null: display the word prominently (e.g., "Your word: **rocket**").
- Otherwise: display a non-revealing placeholder (e.g., "A word has been chosen — start guessing!").

**Validate**: Full quickstart.md validation table (9 checks) passes with two browser tabs.

---

## Data Flow

```
[Tab A — Host/Drawer]                    [Backend]                    [Tab B — Guesser]

  POST /rooms/:code/start ────────────► startRoom()
                                          room.drawerId = hostId
                                          room.currentWord = "rocket"
  ◄─── { room: { drawerId: hostId,
                 currentWord: "rocket" } }
  (GamePage: shows "rocket")

  navigate /game ──────────────────────────────────────────────────► (poll detects "active")
                                                                       GET /rooms/:code?participantId=bob
                                                                       ◄─── { currentWord: null }
                                                                       navigate /game
                                                                       (GamePage: shows hidden placeholder)

  [Host refreshes /game]
  GamePage: room=null → restoreSession()
  GET /rooms/:code?participantId=host ─► fetchRoom()
  ◄─── { currentWord: "rocket" }
  (GamePage: word still visible)

  [Guesser refreshes /game]
  GamePage: room=null → restoreSession()
  GET /rooms/:code?participantId=bob ──► fetchRoom()
  ◄─── { currentWord: null }
  (GamePage: word still hidden)
```

---

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| `toRoomSnapshot` call site missing `viewerParticipantId` returns word to all | Medium | Audit all four call sites; `viewerParticipantId` defaults to `undefined` → `currentWord` is always `null` for unauthenticated calls (safe) |
| GamePage session restore redirects correctly for non-active room | Low | If restored `status !== "active"`, navigate to `/` not `/lobby`; user can re-enter from home |
| `STARTER_WORDS` import path uses `.js` extension in compiled output | Low | Follow existing import pattern already established in `rooms.ts` for `STARTER_WORDS` |
