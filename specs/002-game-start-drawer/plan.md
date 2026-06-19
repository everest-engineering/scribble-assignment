# Implementation Plan: Game Start & Drawer Flow

**Branch**: `scribble-assignment` (single-branch lab) | **Date**: 2026-06-17 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/002-game-start-drawer/spec.md`

**Feature Group**: 2 of 4 — Scenario 2 — builds on Group 1 (`specs/001-room-setup-lobby`)

## Summary

Extend the Group 1 start flow so that, on game start, the room also (a) records the **drawer** (the host),
and (b) selects a **deterministic secret word** from the starter list (index derived from the room code).
Make `toRoomSnapshot` finally use its `viewerParticipantId` argument to return a **viewer-aware** snapshot:
everyone sees who the drawer is and their own role; **only the drawer's snapshot includes the word**.
Add **player-name validation** (trim + reject blank) on create and join, enforced server-side and guarded
client-side. The GamePage shows the drawer's identity to all and the secret word to the drawer only.
Brownfield: extend the existing model, `startGame`, snapshot, and create/join paths — no new deps, polling only.

## Technical Context

**Language/Version**: TypeScript (backend Node 18+ / ESM; frontend React 18 + Vite) — unchanged from Group 1.

**Primary Dependencies**: Express, Zod (backend); React, React Router, `useSyncExternalStore` (frontend). **No new dependencies.**

**Storage**: In-memory `Map<string, Room>` (no DB).

**Testing**: Vitest service-level tests (`roomStore.test.ts`, `schemas.test.ts`); manual two-browser validation per quickstart.

**Target Platform**: Local dev — backend `:3001`, frontend `:5173`.

**Project Type**: Web app (frontend + minimal REST backend).

**Performance Goals**: Drawer/word visible on game start; word/drawer stable across the ~2s poll within the round.

**Constraints**: Polling-only; no auth/DB/persistence; reuse Group 1's `active` state, `hostId`, `startGame`, and the snapshot seam; touch only files related to this group.

**Scale/Scope**: A few concurrent rooms, single round, no rotation.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Gate | Status |
|-----------|------|--------|
| I. Specification Before Implementation | Spec + clarifications committed before planning | ✅ |
| II. Incremental Delivery | Scoped to Group 2; Groups 3–4 deferred | ✅ |
| III. Brownfield Enhancement | Extend model/startGame/snapshot/create-join; no rewrite | ✅ |
| IV. Simplicity Over Expansion | No WebSockets/DB/auth/new libs; deterministic word from existing seed list | ✅ |
| V. Validation First | Two-browser quickstart defines drawer/word visibility checks | ✅ |
| VI. AI Responsibility | Plan reviewed (+ optional `/speckit.analyze`) before implementing | ✅ |
| VII. Traceability | Design elements cite FR IDs | ✅ |
| VIII. Commit Discipline | Per-story `feat(group2):` commits | ✅ |

**Result: PASS** — no violations; Complexity Tracking empty.

## Project Structure

### Documentation (this feature)

```text
specs/002-game-start-drawer/
├── plan.md, spec.md, research.md, data-model.md, quickstart.md
├── contracts/rooms-api.md      # snapshot shape changes + start behavior delta
└── checklists/requirements.md
```

### Source Code (repository root)

```text
backend/src/
├── models/game.ts            # EDIT: Room += drawerId?, secretWord?; RoomSnapshot += drawerId?, role?, word?
├── seed/starterData.ts       # (reuse STARTER_WORDS; no change)
├── services/roomStore.ts     # EDIT: name trim/validate on create+join (throws HttpError(400) — authoritative); startGame assigns drawerId + selectWord(code); toRoomSnapshot becomes viewer-aware (word only for drawer, role per viewer)
├── api/schemas.ts            # (unchanged — name validation is enforced in roomStore so the 400 carries the specific "Enter a player name." message; reconciled per analyze finding I1)
└── api/rooms.ts              # (unchanged; the roomStore HttpError(400) flows through the existing error handler)

frontend/src/
├── services/api.ts           # EDIT: RoomSnapshot type += drawerId?, role?, word?
├── pages/CreateRoomPage.tsx  # EDIT: trim + reject blank name with message before calling API
├── pages/JoinRoomPage.tsx    # EDIT: trim + reject blank name (in addition to Group 1 code guard)
└── pages/GamePage.tsx        # EDIT: show drawer identity to all; show secret word to the drawer only; label guessers
```

**Structure Decision**: Web-app layout reused. All edits extend existing files; no new modules. The single
biggest design point is making `toRoomSnapshot(room, viewerParticipantId)` viewer-aware — the seam Group 1
deliberately left.

## Phase 0 — Research

See [research.md](./research.md). Clarifications resolved the open decisions (word rule, drawer identity,
guesser visibility); research records them as decisions with rationale and rejected alternatives, plus the
name-validation placement (server-authoritative + client guard) and the viewer-aware snapshot approach.

## Phase 1 — Design & Contracts

- **Data model**: [data-model.md](./data-model.md) — `Room` gains `drawerId?` + `secretWord?`; `RoomSnapshot`
  gains `drawerId?`, `role?` (`"drawer"|"guesser"` for the viewer), and `word?` (drawer-only). Round state machine.
- **Contracts**: [contracts/rooms-api.md](./contracts/rooms-api.md) — documents the snapshot delta and the
  expanded `POST /rooms/:code/start` behavior (now also sets drawer + word), name-validation 400s, and the
  drawer-only `word` projection, all traced to FRs. Contract-test checklist included.
- **Quickstart**: [quickstart.md](./quickstart.md) — two-browser validation for name rejection, drawer
  identity, deterministic word, and drawer-only visibility.
- **Agent context**: `CLAUDE.md` SPECKIT block updated to point at this plan.

## Data Flow (summary)

1. **Create/Join** → name trimmed; blank rejected (client message + server 400). Accepted name stored trimmed.
2. **Start** (Group 1 gating still applies) → `startGame` sets `status="active"`, `drawerId = hostId`,
   `secretWord = STARTER_WORDS[hash(code) % n]`.
3. **Poll / view** → `toRoomSnapshot(room, viewerId)` returns `drawerId` + the viewer's `role`; includes
   `word` **only when** `viewerId === drawerId`. Word/drawer stable because both are fixed on the room.
4. **GamePage** → shows "Drawer: <name>" to all; if viewer is drawer, shows the `word`; guessers see their
   role and no word.

## Complexity Tracking

*No constitution violations — section intentionally empty.*
