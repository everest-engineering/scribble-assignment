---
description: "Research decisions for First Round — Drawer Assignment and Secret Word"
---

# Research: First Round — Drawer Assignment and Secret Word

**Feature**: specs/002-first-round-drawer/spec.md
**Date**: 2026-06-02

## Context

The tech stack is fully established by feature 001 (TypeScript 5.x, Node.js 18 + Express, React 18 + Vite, in-memory `Map<string, Room>`). No new dependencies or unknown integration patterns exist. The only architectural question is how to expose the secret word privately — visible to the drawer, hidden from guessers — within the shared `RoomSnapshot` model.

---

## Decision 1: Private Word Exposure via Viewer-Scoped Snapshot

**Decision**: Include `currentWord` in `RoomSnapshot` conditionally based on `viewerParticipantId`. If the viewing participant is the drawer, return the actual word string; otherwise return `null`.

**Rationale**: The existing `toRoomSnapshot(room, viewerParticipantId?)` function already accepts a viewer identity parameter — it was introduced in feature 001 to support the `fetchRoom` endpoint and the `startRoom` response. Extending it to gate `currentWord` is a natural, zero-friction addition that requires no new endpoints or patterns.

All three call sites (`createRoom` response, `joinRoom` response, `fetchRoom` response, `startRoom` response) already pass `viewerParticipantId`, so the change propagates automatically.

**Alternatives considered**:

| Alternative | Why rejected |
|-------------|-------------|
| Separate `GET /rooms/:code/word` endpoint for drawer only | Adds a new endpoint and an extra client request; overkill for one field |
| Encrypt the word client-side | Requires key management; not needed for a local lab game |
| Return word for everyone, hide in UI only | Guesser could read the value from DevTools; fails SC-003 at the network layer |

---

## Decision 2: Deterministic Word Selection — `STARTER_WORDS[0]`

**Decision**: Assign `STARTER_WORDS[0]` (= `"rocket"`) as the `currentWord` when the game transitions to `"active"`. No randomness; no per-game selection logic.

**Rationale**: The spec requires deterministic selection ("same word for identical room state"). The constitution prohibits `Math.random()` for game-rule outcomes (§ Engineering Standards, Determinism). The first word in the seed array is a stable, reproducible choice. Selector logic (e.g. by index, by room code hash) is out of scope and adds unnecessary complexity.

**Alternatives considered**:

| Alternative | Why rejected |
|-------------|-------------|
| Random selection (`Math.random()`) | Prohibited by constitution Determinism rule |
| Room-code hash to pick word index | Over-engineered for a single-round lab scenario |
| Admin-configurable word | Adds scope not requested in spec |

---

## Decision 3: Drawer Identity — `drawerId` Field on Room

**Decision**: Add `drawerId: string | null` to both `Room` (backend store entity) and `RoomSnapshot` (API response shape). Set to `null` in lobby, set to `room.hostId` when `startRoom` transitions status to `"active"`.

**Rationale**: Separating `drawerId` from `hostId` keeps the two concerns independent — host identity is established at room creation and never changes; drawer identity is a game-round concern set at round start. For this lab scenario they are always equal, but the separation is clean and makes `GamePage` logic readable (`room.drawerId` vs `room.hostId`).

**Alternatives considered**:

| Alternative | Why rejected |
|-------------|-------------|
| Derive `drawerId` from `hostId` on the frontend | Couples game-round logic to lobby logic; breaks if drawer rotation is ever added |
| Add `role` field to `Participant` | More invasive model change; unnecessary when a single `drawerId` field suffices |

---

## Decision 4: Session Restore on GamePage

**Decision**: Add the same `restoreSession()` + `useRef` guard pattern to `GamePage` that `LobbyPage` uses. If the restored room has `status !== "active"`, redirect to `/lobby`.

**Rationale**: SC-005 requires that a participant who refreshes `/game` continues to see the correct role and word visibility. Without session restore, a page refresh resets the in-memory React store and `GamePage` redirects to `/`. The restore fetches a fresh snapshot with the correct `currentWord` visibility for the viewer.

**Alternatives considered**:

| Alternative | Why rejected |
|-------------|-------------|
| Let LobbyPage intercept the refresh (navigate to /lobby first) | User lands on home `/`, not lobby; requires two redirects and confuses the user |
| Store full room snapshot in sessionStorage | Stale after backend restart; snapshot can be large; fetch is cheap on localhost |
