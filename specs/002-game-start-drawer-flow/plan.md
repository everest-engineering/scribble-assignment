# Implementation Plan: Game Start & Drawer Flow

**Branch**: `002-game-start-drawer-flow` | **Date**: 2026-06-04 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/002-game-start-drawer-flow/spec.md`

---

## Summary

Extend the existing game-start flow so that the host is atomically assigned as the drawer and a
deterministic secret word is selected when `POST /rooms/:code/start` is called. The secret word is
gated in `toRoomSnapshot` — only the drawer's snapshot carries the actual word; all others receive
`null`. `GamePage` is wired up with polling, drawer identity display, and word reveal, replacing
its current placeholder content.

---

## Technical Context

**Language/Version**: TypeScript 5 (strict) — Node.js 18+ backend, React 18 frontend

**Primary Dependencies**: Express (backend), React + Vite (frontend), Zod (validation), `tsx` (dev execution)

**Storage**: In-memory only (`Map<string, Room>` in `roomStore.ts`) — no persistence

**Testing**: Vitest (backend unit tests), manual two-tab acceptance test

**Target Platform**: Local development — `http://localhost:3001` (backend), `http://localhost:5173` (frontend)

**Project Type**: Brownfield web application enhancement

**Performance Goals**: Sub-100ms response on `POST /rooms/:code/start`; poll latency ≈ 2s

**Constraints**: No WebSockets, no DB, no auth, no new npm dependencies (constitution)

**Scale/Scope**: Single room, 2+ players per room, in-memory only

---

## Constitution Check

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Brownfield-First | ✅ Pass | Extending existing files only; no rewrites |
| II. In-Memory Only | ✅ Pass | `drawerId`/`currentWord` stored on `Room` map |
| III. HTTP Polling | ✅ Pass | `GamePage` uses `startPolling(2000)` / `stopPolling()` |
| IV. Deterministic Rules | ✅ Pass | Word index = `sum(charCodes) % 5`; no `Math.random()` |
| V. TypeScript Strictness | ✅ Pass | All new fields fully typed; no `any` |
| Brownfield Constraints | ✅ Pass | No new dependencies, no auth, no DB, no WS |

**Gate result**: All gates pass. Proceeding to design.

---

## Project Structure

### Documentation (this feature)

```text
specs/002-game-start-drawer-flow/
├── plan.md          ← this file
├── research.md      ← Phase 0
├── data-model.md    ← Phase 1
├── contracts/
│   └── rooms-api.md ← Phase 1
└── tasks.md         ← Phase 2 (/speckit.tasks)
```

### Source Code (files touched by this feature)

```text
backend/
└── src/
    ├── models/
    │   └── game.ts              ← add drawerId, currentWord to Room + RoomSnapshot
    ├── services/
    │   └── roomStore.ts         ← init fields in createRoom(); activate viewerParticipantId in toRoomSnapshot(); add selectWord()
    └── api/
        └── rooms.ts             ← extend POST /:code/start to set drawerId + currentWord

frontend/
└── src/
    ├── services/
    │   └── api.ts               ← add drawerId, currentWord to RoomSnapshot type
    └── pages/
        └── GamePage.tsx         ← wire polling, drawer identity, word reveal panel
```

---

## Data Flow

### Game Start (host clicks "Start Game")

```
Host browser
  → POST /rooms/:code/start { participantId }
  → rooms.ts handler:
      room.drawerId = room.hostId
      room.currentWord = STARTER_WORDS[sum(charCodes of code) % 5]
      room.status = "playing"
      saveRoom(room)
      return toRoomSnapshot(room, participantId)
        → currentWord = room.currentWord  (viewer IS drawer)
        → drawerId = room.hostId
  ← { room: { drawerId, currentWord: "rocket", status: "playing", ... } }
  Frontend: roomStore.setRoomSnapshot(room) → navigate("/game")
```

### Non-host poll (GamePage interval)

```
Non-host browser
  → GET /rooms/:code?participantId=<joinerId>
  → toRoomSnapshot(room, joinerId)
      → currentWord = null  (viewer is NOT drawer)
      → drawerId = room.hostId
  ← { room: { drawerId, currentWord: null, status: "playing", ... } }
  Frontend: renders "Drawing: [drawerName]" + "Guess the word!"
```

### Drawer poll (GamePage interval)

```
Host/drawer browser
  → GET /rooms/:code?participantId=<drawerId>
  → toRoomSnapshot(room, drawerId)
      → currentWord = "rocket"  (viewer IS drawer)
      → drawerId = room.hostId
  ← { room: { drawerId, currentWord: "rocket", status: "playing", ... } }
  Frontend: renders "You are the drawer" + "rocket"
```

---

## Implementation Sequence

### Phase 1 — Backend model + store (no breaking changes)

1. **`backend/src/models/game.ts`**: Add `drawerId: string | null` and `currentWord: string | null`
   to `Room` and `RoomSnapshot` interfaces.

2. **`backend/src/services/roomStore.ts`**:
   - Initialise `drawerId: null, currentWord: null` in `createRoom()`.
   - Add `selectWord(code: string): string` helper using char-code sum derivation.
   - Replace `void viewerParticipantId` in `toRoomSnapshot()` with viewer-gated `currentWord`
     and always-forwarded `drawerId`.

3. **`backend/src/api/rooms.ts`** (`POST /:code/start`): Set `room.drawerId` and `room.currentWord`
   before `saveRoom()`.

### Phase 2 — Frontend types (no UI change yet)

4. **`frontend/src/services/api.ts`**: Add `drawerId: string | null` and `currentWord: string | null`
   to `RoomSnapshot` interface.

### Phase 3 — GamePage wiring

5. **`frontend/src/pages/GamePage.tsx`**:
   - Add redirect guard: if `!room`, navigate to `/` with `replace: true` (already present —
     verify and keep).
   - Add loading guard: if `room.drawerId === null`, render `"Loading game..."`.
   - Add polling `useEffect`: `roomStore.startPolling(2000)` on mount; `roomStore.stopPolling()`
     on unmount; keyed on `room.code`.
   - Add `pollError` display below the drawer/word panel.
   - Resolve drawer name: `room.participants.find(p => p.id === room.drawerId)?.name ?? "Unknown drawer"`.
   - Render drawer identity card:
     - Self = drawer → `"You are the drawer"`
     - Self ≠ drawer → `"Drawing: [drawerName]"`
   - Render word panel:
     - `room.currentWord !== null` → display word (drawer)
     - otherwise → display `"Guess the word!"`

---

## Testing Strategy

### Manual two-tab acceptance test

1. Tab A: create room, Tab B: join room.
2. Tab A: click Start Game.
3. Tab A (drawer): game screen shows actual word and "You are the drawer".
4. Tab B (non-drawer): game screen shows "Guess the word!" and "Drawing: [Tab A name]".
5. Inspect Tab B network — confirm `currentWord: null` in all GET responses.
6. Navigate away from both tabs — confirm no further network requests.

### Vitest unit tests (backend)

- `selectWord()` helper: assert determinism — same code → same word, different codes → potentially different words.
- `toRoomSnapshot()` with drawer `viewerParticipantId` → `currentWord` is actual word.
- `toRoomSnapshot()` with non-drawer `viewerParticipantId` → `currentWord` is `null`.
- `toRoomSnapshot()` with `undefined` `viewerParticipantId` → `currentWord` is `null`.
- `POST /rooms/:code/start` response: `drawerId === hostId`, `currentWord` is in `STARTER_WORDS`.

### TypeScript build check

- `cd backend && npm run build` — zero errors.
- `cd frontend && npm run build` — zero errors.

---

## Risks & Mitigations

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| `GamePage` re-render loop if polling starts before `room.drawerId` resolves | Low | Loading guard (`drawerId === null`) prevents render; polling fills it within 2s |
| Non-drawer sees word via stale cache | Low | `currentWord` gating is in `toRoomSnapshot` — server-side; no client-side cache bypass possible |
| `selectWord` import cycle (`STARTER_WORDS` already imported in `roomStore.ts`) | None | `STARTER_WORDS` is already imported; no new import needed |
| Polling conflict: `LobbyPage` → `GamePage` transition may call `startPolling` twice | Low | `startPolling` calls `stopPolling` first; safe to call again |

---

## Dependencies

- Scenario 1 (001-room-setup-lobby) must be complete:
  - `hostId` on `Room` ✅ (implemented)
  - `RoomStatus` union extended ✅ (implemented)
  - `POST /rooms/:code/start` handler exists ✅ (implemented)
  - `startPolling`/`stopPolling` on `RoomStore` ✅ (implemented)
- No external service dependencies.
- No new npm packages.
