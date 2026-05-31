# Scribble Lab — Discovery Notes

**Date:** 2026-05-31  
**Scope:** Brownfield inspection of the starter scaffold before Spec Kit specify/plan/tasks work  
**Source of truth for requirements:** [README.md](../README.md) business scenarios and out-of-scope rules

---

## Purpose

This document captures what the starter already implements, which files matter, what behavior is missing relative to the lab scenarios, and working assumptions to resolve during `/speckit.clarify` and `/speckit.specify`.

---

## Starter Summary

The repo is a runnable but intentionally incomplete Scribble-style guessing game:

| Layer | Stack | Role |
|-------|-------|------|
| Frontend | Vite, React 18, React Router v6, TypeScript | Pages, UI placeholders, client state via custom `RoomStore` |
| Backend | Node.js, Express, TypeScript, Zod, Vitest | REST API, in-memory rooms, snapshot responses |
| Sync model | HTTP only (manual refresh today) | Learners add polling; WebSockets forbidden |

**Seed data (backend):** words `rocket`, `pizza`, `castle`, `guitar`, `sunflower`; roles `drawer`, `guesser`.

**Verified starter flow:** create room → lobby → manual refresh shows joined players → any user can navigate to game screen with placeholder UI.

---

## Relevant Files

### Backend

| File | Responsibility |
|------|----------------|
| [backend/src/models/game.ts](../backend/src/models/game.ts) | Core types: `Participant`, `Room`, `RoomSnapshot`; `RoomStatus` is only `"lobby"` |
| [backend/src/services/roomStore.ts](../backend/src/services/roomStore.ts) | In-memory `Map` storage, create/join/get/save, snapshot builder |
| [backend/src/api/rooms.ts](../backend/src/api/rooms.ts) | `POST /rooms`, `POST /rooms/:code/join`, `GET /rooms/:code` |
| [backend/src/api/schemas.ts](../backend/src/api/schemas.ts) | Zod request/query validation |
| [backend/src/api/router.ts](../backend/src/api/router.ts) | API mount, centralized error handling |
| [backend/src/seed/starterData.ts](../backend/src/seed/starterData.ts) | Word list and role labels |
| [backend/src/app.ts](../backend/src/app.ts) | Express app + `/health` |
| [backend/src/services/roomStore.test.ts](../backend/src/services/roomStore.test.ts) | Basic create/join tests only |

### Frontend

| File | Responsibility |
|------|----------------|
| [frontend/src/services/api.ts](../frontend/src/services/api.ts) | Typed fetch client for the three room endpoints |
| [frontend/src/state/roomStore.ts](../frontend/src/state/roomStore.ts) | Session state (`room`, `participantId`, loading/error), create/join/fetch |
| [frontend/src/pages/CreateRoomPage.tsx](../frontend/src/pages/CreateRoomPage.tsx) | Create-room form |
| [frontend/src/pages/JoinRoomPage.tsx](../frontend/src/pages/JoinRoomPage.tsx) | Join-room form (uppercases code client-side) |
| [frontend/src/pages/LobbyPage.tsx](../frontend/src/pages/LobbyPage.tsx) | Participant list, manual refresh, client-only “Start Game” |
| [frontend/src/pages/GamePage.tsx](../frontend/src/pages/GamePage.tsx) | Game layout with placeholders |
| [frontend/src/components/GuessForm.tsx](../frontend/src/components/GuessForm.tsx) | Guess input; submit is a no-op |
| [frontend/src/components/Scoreboard.tsx](../frontend/src/components/Scoreboard.tsx) | Static placeholder |
| [frontend/src/components/ResultPanel.tsx](../frontend/src/components/ResultPanel.tsx) | Static placeholder |
| [frontend/src/routes/index.tsx](../frontend/src/routes/index.tsx) | Route table |

### Project guidance

| File | Responsibility |
|------|----------------|
| [README.md](../README.md) | Lab objectives, scenarios, build order, evaluation rubric |
| [AGENTS.md](../AGENTS.md) | Engineering constraints (no WebSockets, DB, auth) |
| [.specify/memory/constitution.md](../.specify/memory/constitution.md) | Template only — not yet filled in |

---

## What Works Today

- App shell, routing, and branded Start / Create / Join / Lobby / Game screens
- `POST /rooms` creates a 4-character code and first participant
- `POST /rooms/:code/join` adds a participant or returns 404
- `GET /rooms/:code?participantId=` returns a room snapshot
- In-memory isolation between rooms (separate `Map` entries)
- Lobby displays participants from the last fetched snapshot
- Manual **Refresh Room** button calls `fetchRoom()`
- Frontend persists `participantId` and `room` in `RoomStore` for the session
- Basic Vitest coverage for room creation and unknown join

---

## Gaps (Incomplete Behaviors)

Each gap maps to a required lab scenario. These are the behaviors the starter does **not** implement yet.

### Gap 1 — Host identity and host-only start (Scenario 1)

**Observed:** Room creator is the first participant but there is no `hostId` (or equivalent) on `Room`. In [LobbyPage.tsx](../frontend/src/pages/LobbyPage.tsx), **Start Game** is visible to every player and only calls `navigate("/game")` — no API call, no permission check, no 2-player minimum.

**Required:** Creator is host; only host can start; at least 2 players must be present.

---

### Gap 2 — Automatic lobby polling (Scenario 1)

**Observed:** [roomStore.ts](../frontend/src/state/roomStore.ts) exposes `fetchRoom()` but nothing polls automatically. [LobbyPage.tsx](../frontend/src/pages/LobbyPage.tsx) relies on a manual refresh button.

**Required:** Lobby refreshes via polling at ~2 second intervals so joiners appear without manual action.

---

### Gap 3 — Join / input validation with clear feedback (Scenario 1 & 2)

**Observed:**

- [joinRoomSchema](../backend/src/api/schemas.ts) and [createRoomSchema](../backend/src/api/schemas.ts) treat `playerName` as optional with no trim/non-empty rules.
- [roomStore.ts](../backend/src/services/roomStore.ts) `displayName()` substitutes `"Player"` for missing names — empty/whitespace names are silently accepted.
- [JoinRoomPage.tsx](../frontend/src/pages/JoinRoomPage.tsx) submits empty room codes to the API; invalid codes get a generic error from the 404 response.

**Required:** Invalid/empty room codes and empty/whitespace-only player names rejected with clear user-facing messages.

---

### Gap 4 — Game start, drawer assignment, and secret word (Scenario 2)

**Observed:**

- `RoomStatus` is only `"lobby"` in [game.ts](../backend/src/models/game.ts).
- No endpoint to transition room to playing state.
- `toRoomSnapshot()` accepts `viewerParticipantId` but explicitly ignores it (`void viewerParticipantId`) — no per-viewer filtering.
- No secret word field on room state; `availableWords` is always the full starter list for everyone.
- No drawer role stored on participants.

**Required:** Host (or first player) becomes drawer; word chosen deterministically from starter list; word visible only to drawer.

---

### Gap 5 — Drawing, clear canvas, and synced strokes (Scenario 3)

**Observed:** [GamePage.tsx](../frontend/src/pages/GamePage.tsx) renders a non-interactive placeholder div (“Waiting for drawer…”). No stroke model, no canvas API, no clear action, no server persistence.

**Required:** Drawer can draw and clear; drawing visible to all players via polling.

---

### Gap 6 — Guess submission, history sync, and scoring (Scenario 3)

**Observed:**

- [GuessForm.tsx](../frontend/src/components/GuessForm.tsx) `handleSubmit` prevents default and does nothing.
- No guess-related API routes.
- [Scoreboard.tsx](../frontend/src/components/Scoreboard.tsx) shows hard-coded “0”.
- No guess history in `Room` / `RoomSnapshot` types.

**Required:** Trimmed guesses, reject empty, case-insensitive compare, synced history via polling, +100 for correct / +0 for incorrect, all scores start at 0.

---

### Gap 7 — Result state and restart (Scenario 4)

**Observed:** No `"result"` status, no round-end trigger, [ResultPanel.tsx](../frontend/src/components/ResultPanel.tsx) is a static placeholder, no restart endpoint or lobby reset logic.

**Required:** All players see correct word, final scores, full guess history; host restart returns everyone to lobby with players preserved and round state cleared.

---

### Gap 8 — Gameplay polling and route guards

**Observed:** No polling on the game screen. Navigation to `/game` is client-only and not tied to server `status`. A player can open `/game` without a started round.

**Required (implied by scenarios):** Game and result views should reflect server state; polling keeps guesses, scores, canvas, and status in sync across tabs.

---

## Assumptions

Documented here for the clarify/specify phases. Change any assumption that contradicts clarified requirements.

### A1 — Host is the room creator

The first participant created by `createRoom()` is the permanent host for that room’s lifetime. Scenario 2’s “host (or first player)” is interpreted as: the creator is host, and the host is the drawer for the single round.

### A2 — Single round only

Per README out-of-scope rules: no drawer rotation, timers, or multiple rounds. One round per room session; restart clears round state and returns to lobby for another single round.

### A3 — Deterministic word selection

The secret word is selected deterministically from `STARTER_WORDS` (same room code → same word). Exact algorithm (e.g., index from room code hash) to be fixed in the spec for testability.

### A4 — Polling interval ~2 seconds

Lobby and active game/result phases poll `GET /rooms/:code` approximately every 2 seconds. Exact tolerance (fixed interval vs. backoff) to be confirmed in spec.

### A5 — Drawing represented as server-stored stroke data

Canvas interaction will serialize strokes (or equivalent drawing commands) to the backend so guessers receive updates through the same polling snapshot — not local-only canvas state.

### A6 — `participantId` identifies the viewer for filtered snapshots

The existing optional `participantId` query param is the intended hook for drawer-only word visibility and role-specific fields in API responses.

### A7 — Game navigation follows server status

When the host starts the game, server `status` changes (e.g., `playing`); clients detect this via polling and navigate or render accordingly rather than trusting client-only navigation alone.

### A8 — No persistence across backend restart

In-memory storage is acceptable; all rooms are lost on server restart (aligned with AGENTS.md and README).

---

## API Surface: Current vs. Expected

| Endpoint | Today | Likely needed |
|----------|-------|----------------|
| `GET /health` | OK | unchanged |
| `POST /rooms` | Creates room + participant | + host tracking, name validation |
| `POST /rooms/:code/join` | Join if exists | + name validation, clearer errors |
| `GET /rooms/:code` | Full snapshot (unfiltered) | + status-aware fields, viewer filtering, strokes, guesses, scores |
| — | — | Start game (host-only) |
| — | — | Submit guess |
| — | — | Update drawing / clear canvas |
| — | — | Restart to lobby (host-only) |

Exact route shapes belong in `/speckit.plan`; this table flags missing capabilities.

---

## Data Model: Current vs. Expected

**`Room` today:** `code`, `status: "lobby"`, `participants[]` (`id`, `name`, `joinedAt`), timestamps.

**Likely extensions (to specify):**

- `hostId: string`
- `status`: `"lobby" | "playing" | "result"` (or equivalent)
- `drawerId: string`
- `secretWord: string` (server-only; filtered in snapshots)
- `scores: Record<participantId, number>` or score on participant
- `guesses: Guess[]` (player, text, correct, timestamp)
- `strokes` or drawing payload for canvas sync
- Round metadata cleared on restart; `participants` and `hostId` preserved

---

## UI / Copy Drift

[StartPage.tsx](../frontend/src/pages/StartPage.tsx) marketing copy mentions “real-time” and “across all rounds.” Per README, treat that as presentational only; actual scope is HTTP polling and a single round.

---

## Scenario Traceability

| Scenario | Primary gaps | Primary files |
|----------|--------------|---------------|
| 1 — Room setup & lobby | Gaps 1, 2, 3 | `roomStore.ts`, `LobbyPage.tsx`, `rooms.ts`, `schemas.ts` |
| 2 — Game start & drawer | Gaps 3, 4, 8 | `game.ts`, `roomStore.ts`, `rooms.ts`, `LobbyPage.tsx` |
| 3 — Gameplay interaction | Gaps 5, 6, 8 | `GamePage.tsx`, `GuessForm.tsx`, new API routes |
| 4 — Result & restart | Gap 7 | `ResultPanel.tsx`, `Scoreboard.tsx`, `roomStore.ts` |

---

## Open Questions for Clarify

1. **Round end trigger:** Does the round end on first correct guess, drawer giving up, or only when host ends it? (Not stated explicitly in README scenarios.)
2. **Drawer drawing visibility:** Can the drawer also submit guesses, or are they excluded from guessing?
3. **Duplicate guesses:** Can the same player guess multiple times; are duplicate text guesses allowed?
4. **Canvas clear scope:** Does clear remove all strokes for everyone immediately on next poll?
5. **Invalid room code format:** Should malformed codes (wrong length, invalid chars) be rejected before the API call with a distinct message from “room not found”?

---

## Recommended Next Steps

1. **`/speckit.constitution`** — Fill [.specify/memory/constitution.md](../.specify/memory/constitution.md) with stack constraints, polling rules, and review discipline.
2. **`/speckit.clarify`** — Resolve open questions above; encode answers in feature specs.
3. **`/speckit.specify`** — Scenario 1 first (`specs/001-room-setup-lobby/spec.md` or similar).
4. **`/speckit.plan` / `/speckit.tasks`** — File-level plan aligned with gaps in this document.

---

## Discovery Checklist (Rubric)

| Criterion | Met |
|-----------|-----|
| ≥ 3 incomplete behaviors documented | Yes (8 gaps) |
| ≥ 2 assumptions documented | Yes (8 assumptions) |
| Relevant files listed | Yes |
