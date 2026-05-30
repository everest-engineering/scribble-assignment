# Implementation Plan: Game Start & Drawer Flow (Scenario 2)

**Branch**: `scribble-lab` | **Date**: 2026-05-29 | **Spec**: [spec.md](./spec.md)

**Input**: Scenario 2 — Game Start & Drawer Flow. Frontend: React + Vite + TypeScript. Backend: Node.js + Express + TypeScript + Zod.

**Scope boundary**: Implement FR-001–FR-014 only. Extends Scenario 1 `playing` state with round setup (roles, deterministic word, drawer-only visibility). No drawing, guesses, scoring, or round-end (Scenarios 3–4).

**Prerequisite**: Scenario 1 complete (`specs/001-room-setup-lobby/`) — host, start game, lobby polling, `playing` status transition.

## Summary

Extend the brownfield starter so that (1) player names are trimmed and empty names rejected on create/join, (2) `startGame` initializes the first round with host-as-drawer and a deterministic secret word, (3) viewer-aware snapshots expose the word only to the drawer, and (4) the game page polls ~2s to keep roles and word visibility consistent across clients.

## Technical Context

**Language/Version**: TypeScript (ES modules) — Node.js backend, React 18 frontend  
**Primary Dependencies**: Express, Zod, React Router v6, Vite  
**Storage**: In-memory `Map<string, Room>` — no persistence  
**Testing**: Vitest (backend pure logic); manual two-tab validation on game view  
**Target Platform**: Local dev — backend `:3001`, frontend `:5173`  
**Performance Goals**: Game poll cadence ~2s; drawer/word visible within one poll cycle after start (SC-006, SC-007)  
**Constraints**: HTTP polling only; deterministic word from starter list; Zod on mutating routes  
**Scale/Scope**: First round only; ~10 files touched

## Constitution Check

| Principle | Requirement | Plan compliance |
|-----------|-------------|-----------------|
| II — Architecture | No WebSockets, DB, auth | ✅ REST + ~2s polling only |
| III — Deterministic rules | Starter words only; deterministic selection; Zod validation | ✅ `selectWord(code)` pure function; no `Math.random` for words |
| V — Minimal diffs | Brownfield extension of Scenario 1 | ✅ Targeted edits listed below |
| VI — Validation | Two-tab manual + build both apps | ✅ Testing Strategy below |
| VII — Testing | Vitest for word selection, name validation, snapshot rules | ✅ Unit tests planned |

**Post-design re-check**: No violations.

## Project Structure

### Documentation (this feature)

```text
specs/002-game-start-drawer-flow/
├── spec.md
├── plan.md              # This file
└── tasks.md             # (/speckit-tasks — not yet created)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── models/game.ts              # + drawerId, secretWord, participant role in snapshot
│   ├── services/wordSelection.ts   # NEW — deterministic selectWord(roomCode)
│   ├── services/wordSelection.test.ts
│   ├── services/roomStore.ts       # startGame round init; viewer-aware snapshot
│   ├── services/roomStore.test.ts
│   ├── api/schemas.ts              # playerName trim + min(1)
│   └── api/schemas.test.ts
frontend/
├── src/
│   ├── services/api.ts             # extended snapshot types
│   ├── pages/CreateRoomPage.tsx    # client name validation
│   ├── pages/JoinRoomPage.tsx      # client name validation
│   ├── pages/GamePage.tsx          # roles, secret word, polling
│   ├── hooks/useGamePolling.ts     # NEW — ~2s poll while playing
│   └── styles/app.css              # drawer/guesser role badges
```

**Not modified for Scenario 2 gameplay**: `GuessForm` submission logic, canvas drawing, `Scoreboard` scoring (placeholders may remain).

## Starter Gaps (Discovery)

| Area | Current behavior | Required for Scenario 2 |
|------|------------------|-------------------------|
| Player names | Optional; defaults to `"Player"` | Trim; reject empty (FR-001–FR-003) |
| `startGame` | Sets `status: "playing"` only | Assign drawer, pick word, store round state (FR-004–FR-008) |
| `Room` model | No `drawerId` or `secretWord` | Add round fields on room |
| `toRoomSnapshot` | No roles or word in snapshot | Per-participant `role`; viewer-specific `secretWord` (FR-009–FR-010) |
| `GamePage` | Generic placeholders | Show word for drawer; role badges; hide word for guessers (FR-006, FR-011) |
| Game polling | None on `/game` | ~2s poll while `playing` (FR-012–FR-013) |

## Data Model

### Backend types (`backend/src/models/game.ts`)

**Room** (add fields, set at `startGame`):

| Field | Type | When set |
|-------|------|----------|
| `drawerId` | `string` | `startGame` — equals `hostId` for first round |
| `secretWord` | `string` | `startGame` — from `selectWord(code)` |

**ParticipantSnapshot** (extend):

| Field | Type | Notes |
|-------|------|-------|
| `role` | `"drawer" \| "guesser"` | Derived: `id === drawerId` → drawer |

**RoomSnapshot** (extend):

| Field | Type | Notes |
|-------|------|-------|
| `drawerId` | `string` | Present when `status === "playing"` |
| `viewerRole` | `"drawer" \| "guesser" \| null` | From viewer participant id |
| `secretWord` | `string \| null` | Word if viewer is drawer; `null` otherwise |

### Deterministic word selection

Pure function in `backend/src/services/wordSelection.ts`:

```text
selectWord(roomCode: string): string
  → STARTER_WORDS[sum(charCodeOf each char in code) % STARTER_WORDS.length]
```

Same room code always yields the same word (SC-004). Export for Vitest.

### State transition (extends Scenario 1)

```text
lobby  →  (host startGame)  →  playing
         + drawerId = hostId
         + secretWord = selectWord(code)
         + participants unchanged (roles derived in snapshot)
```

## API Behavior (extends existing routes)

No new endpoints. Changes affect payloads on existing routes:

| Route | Scenario 2 change |
|-------|-------------------|
| `POST /rooms` | Reject empty trimmed `playerName` (400); store trimmed name |
| `POST /rooms/:code/join` | Same name validation |
| `POST /rooms/:code/start` | Initialize round fields; snapshot includes roles |
| `GET /rooms/:code?participantId=` | Viewer-aware `secretWord`, `viewerRole`, participant `role` |

**Name validation errors**: 400 with message `"Player name is required"`.

## Data Flow

### Flow 1 — Name validation (P1)

```text
CreateRoomPage / JoinRoomPage → trim name → [empty? show error]
  → POST with trimmed name → Zod trim.min(1) → createParticipant(trimmedName)
```

### Flow 2 — Round init on start (P2, P3)

```text
Host startGame (Scenario 1 route)
  → startGame(): status=playing, drawerId=hostId, secretWord=selectWord(code)
  → toRoomSnapshot(viewerId) with roles
  → clients navigate to /game
```

### Flow 3 — Viewer-aware snapshot (P4)

```text
GET /rooms/:code?participantId=X
  → toRoomSnapshot:
      participant.role from drawerId
      secretWord = room.secretWord if X === drawerId else null
      viewerRole for current viewer
```

### Flow 4 — Game polling (P5)

```text
GamePage mounts → useGamePolling(2000ms)
  → fetchRoomSilent while status === "playing"
  → drawer sees secretWord; guesser sees null
  → poll errors surfaced; interval continues
```

## Implementation Sequence

Ordered by user story priority.

### Slice 1 — P1: Player name validation (FR-001–FR-003, FR-014)

**Backend**

1. `schemas.ts`: `createRoomSchema` / `joinRoomSchema` — `playerName: z.string().trim().min(1, "Player name is required")` (required, not optional).
2. `roomStore.ts`: Remove `displayName` fallback to `"Player"` for create/join paths; use trimmed name from schema.
3. `schemas.test.ts`: Empty and whitespace-only names throw.

**Frontend**

4. `CreateRoomPage.tsx`: Trim name before submit; early error if empty.
5. `JoinRoomPage.tsx`: Same trim validation (in addition to existing code validation).

**Verify**: Empty name blocked on both forms; `" Alice "` stored as `"Alice"`.

### Slice 2 — P2 + P3: Round init & deterministic word (FR-004–FR-008)

**Backend**

6. `wordSelection.ts` + `wordSelection.test.ts`: Implement and test `selectWord` determinism and starter-list membership.
7. `game.ts`: Add `drawerId`, `secretWord` to `Room`; extend snapshot types with `role`, `viewerRole`, `secretWord`.
8. `roomStore.ts`: In `startGame`, set `drawerId = hostId`, `secretWord = selectWord(code)`.
9. `roomStore.test.ts`: Assert host is drawer; word stable for same code; word in starter list.

**Verify**: Vitest passes; after start, room has drawer and word server-side.

### Slice 3 — P4: Viewer-aware snapshot & game UI (FR-006, FR-009–FR-011)

**Backend**

10. `roomStore.ts`: Update `toRoomSnapshot` — participant `role`, viewer `secretWord`/`viewerRole` when `status === "playing"`.
11. `roomStore.test.ts`: Guesser gets `secretWord: null`; drawer gets word.

**Frontend**

12. `api.ts`: Mirror extended snapshot types.
13. `GamePage.tsx`:
    - Participant list with drawer/guesser badges (reuse host badge pattern from lobby).
    - Prominent secret word panel when `viewerRole === "drawer"`.
    - No word UI for guessers.
    - Update Player Info status to show role.
14. `app.css`: `.player-list__meta--drawer` / `--guesser` styles.

**Verify**: Two-tab — host sees word; joiner does not.

### Slice 4 — P5: Game polling (FR-012–FR-013, FR-014)

**Frontend**

15. `hooks/useGamePolling.ts`: Mirror `useLobbyPolling` but active when `status === "playing"`; no navigate away.
16. `GamePage.tsx`: Wire hook; show poll errors without crashing.

**Verify**: Both tabs agree on drawer within one poll cycle; word visibility holds on every poll.

## File Change Reference

| File | Changes |
|------|---------|
| `backend/src/models/game.ts` | Round fields + snapshot extensions |
| `backend/src/services/wordSelection.ts` | **new** — deterministic word pick |
| `backend/src/services/wordSelection.test.ts` | **new** |
| `backend/src/services/roomStore.ts` | Name handling, startGame round init, snapshot |
| `backend/src/services/roomStore.test.ts` | Word, roles, name tests |
| `backend/src/api/schemas.ts` | Required trimmed playerName |
| `backend/src/api/schemas.test.ts` | Name validation tests |
| `frontend/src/services/api.ts` | Extended types |
| `frontend/src/pages/CreateRoomPage.tsx` | Client name validation |
| `frontend/src/pages/JoinRoomPage.tsx` | Client name validation |
| `frontend/src/pages/GamePage.tsx` | Roles, word display, polling |
| `frontend/src/hooks/useGamePolling.ts` | **new** |
| `frontend/src/styles/app.css` | Role badge styles |

## Testing Strategy

| Layer | What | Maps to |
|-------|------|---------|
| Vitest | `selectWord` determinism; name schema; snapshot word leak prevention | FR-001–003, FR-007–010, SC-004–SC-005 |
| Manual two-tab | Flows below | P1–P5, SC-001–SC-007 |
| Build | `npm run build` both apps | Constitution VI |

**Manual validation** (two tabs):

1. **P1**: Empty names rejected on create/join; trimmed names work.
2. **P2**: After start, both tabs show same drawer (host).
3. **P3**: Same room code → same word (note word when testing).
4. **P4**: Drawer tab shows word; guesser tab does not (including after poll).
5. **P5**: Roles/word visibility stable without manual refresh.

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Word leaks in JSON logs | Never log `secretWord`; test guesser snapshot |
| Breaking Scenario 1 lobby | Only add round fields at `startGame`; lobby snapshot unchanged |
| Optional playerName regression | Schema now required — update API tests |
| Scope creep into Scenario 3 | Leave GuessForm/Scoreboard as placeholders; no guess POST |

## Out of Scope Reminders

- Interactive drawing, clear canvas, guess submission, guess history, scoring (Scenario 3)
- Multiple rounds, drawer rotation, timers (README out of scope)
- Result reveal, restart to lobby (Scenario 4)
- WebSockets, DB, auth, custom word packs

**Next step**: Run `/speckit-tasks` to generate ordered `tasks.md` from this plan.
