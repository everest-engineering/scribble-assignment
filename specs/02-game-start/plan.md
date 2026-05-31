# Implementation Plan: Group 2 — Game Start & Drawer Flow

**Branch**: `group-2-game-start-drawer` | **Date**: 2026-05-31 | **Spec**: [spec.md](spec.md) | **Tasks**: [tasks.md](tasks.md)

---

## Summary

Extend the room model with `drawerParticipantId` and `currentWord`, add a `POST /rooms/:code/start` endpoint that transitions a room from `"lobby"` to `"playing"`, gate the word in `toRoomSnapshot` by viewer identity, wire the Start Game button to the real API call, and render role-aware banners on the game screen with auto-polling.

---

## Technical Context

**Language/Version**: TypeScript 5.6 strict, Node 18+

**Primary Dependencies**: Express 4, React 18, Zod 3 — all already installed; no new packages

**Storage**: In-memory `Map<string, Room>` — unchanged

**Testing**: Vitest on both frontend and backend

**Target Platform**: localhost — backend port 3001, frontend port 5173

**Constraints**: No WebSockets, no new npm dependencies, TypeScript strict mode must pass, no `any`

---

## Constitution Check

| Rule | Status | Notes |
|---|---|---|
| Extend existing files only | ✅ | No new files; all 7 changed files already exist |
| No new npm dependencies | ✅ | None needed |
| Zod schemas in `api/schemas.ts` | ✅ | `startRoomSchema` added there |
| All API calls through `services/api.ts` | ✅ | `api.startGame()` added there |
| Polling via `setInterval`/`clearInterval` | ✅ | Same pattern as LobbyPage |
| TypeScript strict, no `any` | ✅ | All new fields fully typed |
| No WebSockets | ✅ | Not applicable |
| No database | ✅ | Not applicable |

No constitution violations.

---

## Project Structure

### Files that change

```text
backend/src/
├── models/
│   └── game.ts               ← widen RoomStatus; add drawerParticipantId + currentWord to Room;
│                               add drawerParticipantId + currentWord + viewerRole to RoomSnapshot
├── services/
│   └── roomStore.ts          ← initialise new Room fields in createRoom();
│                               add startGame(); update toRoomSnapshot() to gate word + set viewerRole
└── api/
    ├── schemas.ts            ← add startRoomSchema
    └── rooms.ts              ← add POST /:code/start route

frontend/src/
├── services/
│   └── api.ts                ← add new fields to RoomSnapshot; widen status; add startGame()
├── pages/
│   ├── LobbyPage.tsx         ← replace navigate("/game") with async startGame call + error display
│   └── GamePage.tsx          ← add polling; render role banner; wire GuessForm disabled prop
```

### No new files required.

---

## Phase Design

### Phase 1 — Backend Model Extension (blocking)

Extend `game.ts` with `RoomStatus = "lobby" | "playing"`, add `drawerParticipantId: string | null` and `currentWord: string | null` to `Room`, and add `drawerParticipantId`, `currentWord`, `viewerRole` to `RoomSnapshot`.

TypeScript will immediately surface two errors: `createRoom()` constructs a `Room` literal (must add the new nullable fields) and `toRoomSnapshot()` constructs a `RoomSnapshot` literal (must add the new fields). Fix both in the same pass.

**Gate**: `npm run build` in `backend/` passes with zero errors.

---

### Phase 2 — `startGame()` Service Function

Add `startGame(code, participantId)` to `roomStore.ts`. Returns a discriminated result object — no throwing — so the route handler owns all HTTP status decisions.

Logic:
1. Look up room → `NOT_FOUND` if absent
2. Check `participantId === room.hostId` → `FORBIDDEN` if not
3. Check `room.status !== "playing"` → `CONFLICT` if already playing
4. Check `room.participants.length >= 2` → `BAD_REQUEST` if not
5. Mutate: `status = "playing"`, `drawerParticipantId = participants[0].id`, `currentWord = STARTER_WORDS[0]`
6. `saveRoom(room)` → return `{ code: "OK", room }`

Also update `toRoomSnapshot()` to:
- Map `drawerParticipantId: room.drawerParticipantId`
- Gate `currentWord`: return `room.currentWord` only if `viewerParticipantId === room.drawerParticipantId`, else `null`
- Derive `viewerRole`: `"drawer"` if viewer is drawer, `"guesser"` if any other participant, `null` if no viewer id

**Gate**: Unit-test `startGame()` manually — curl a started room and confirm the discriminated result codes map correctly before wiring the route.

---

### Phase 3 — `POST /rooms/:code/start` Route + Schema

Add `startRoomSchema` to `schemas.ts`. Add the route to `rooms.ts` after `POST /:code/join`. Translate result codes to HTTP statuses directly in the handler.

```
NOT_FOUND  → 404
FORBIDDEN  → 403
CONFLICT   → 409
BAD_REQUEST → 400
OK         → 200 + { participantId: body.participantId, room: toRoomSnapshot(room, body.participantId) }
```

**Gate**: `npm run build` passes. Curl smoke tests for all 5 result codes pass (see tasks for commands).

---

### Phase 4 — Frontend Type + API Extension

Add new fields to the local `RoomSnapshot` in `api.ts`, widen `status`, and add `api.startGame()`. This unblocks the frontend components.

**Gate**: `npm run build` in `frontend/` passes.

---

### Phase 5 — LobbyPage: Wire Start Game Button + Status-Driven Navigation (US1)

Replace `onClick={() => navigate("/game")}` with an async `handleStartGame` that calls `api.startGame`, calls `roomStore.setRoomSession(response)`, then navigates. Add error state to display failures to the user.

**Critical**: Also add a `useEffect` that watches `room?.status` and navigates to `/game` when it becomes `"playing"`. Without this, non-host participants whose polling picks up the status change are never forwarded — they stay in the lobby indefinitely. The host's button click also triggers this effect harmlessly (navigate is idempotent).

```typescript
useEffect(() => {
  if (room?.status === "playing") {
    navigate("/game", { replace: true });
  }
}, [room?.status, navigate]);
```

**Gate**: Two-tab test — Tab A clicks Start Game; **Tab B automatically navigates to `/game` within ≤4 seconds** without any user action.

---

### Phase 6 — GamePage: Polling + Role Banners (US2 + US3)

Add `setInterval` polling (2000 ms, `clearInterval` on unmount). Derive `viewerRole` from `room.viewerRole`. Render drawer/guesser banners. Pass `disabled={room.viewerRole === "drawer"}` to `<GuessForm />`. Show drawer name to all.

**Gate**: Tab A (drawer) sees "You are the Drawer — draw: rocket" and disabled form. Tab B (guesser) sees "You are a Guesser" and enabled form. DevTools confirms polling stops after Exit Game.

---

### Phase 7 — Build & Test Verification

`npm run build && npm test` on both packages. All exit 0.

---

## Dependency Order

```
Phase 1 (model extension — game.ts + createRoom/toRoomSnapshot fixes)
    ↓
Phase 2 (startGame() service + toRoomSnapshot word/role gating)
    ↓
Phase 3 (schema + route)         Phase 4 (frontend types + api.startGame)
    ↓                                  ↓
Phase 5 (LobbyPage wiring) ←──────────┘
    ↓
Phase 6 (GamePage polling + banners)
    ↓
Phase 7 (full build + test)
```

Phases 3 and 4 can run in parallel after Phase 2. Phase 5 requires both 3 and 4. Phase 6 requires Phase 5 (game must be startable to test role rendering).

---

## Risk & Notes

- **`toRoomSnapshot` word gating correctness**: the drawer check is `viewerParticipantId === room.drawerParticipantId`. Both are `string | null` — if both are `null`, this would incorrectly return the word. Guard: `room.drawerParticipantId !== null && viewerParticipantId === room.drawerParticipantId`.
- **`RoomSnapshot.drawerParticipantId` type in spec says `string | null`**: this is correct because before a game starts the field is null. The frontend must handle null (no drawer name to show) gracefully.
- **`setRoomSession` vs `setRoomSnapshot`**: `startGame` returns `{ participantId, room }` — use `setRoomSession` (not `setRoomSnapshot`) so `participantId` in the store stays in sync.
- **`participants[0]` is always the host**: this is guaranteed by `createRoom()` which puts the creator first. No defensive check needed.
