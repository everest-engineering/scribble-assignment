# API Contract: Game Start — Drawer Assignment and Word Reveal

**Branch**: `003-drawer-word-reveal` | **Date**: 2026-05-30

## No New or Modified API Endpoints

This feature introduces **no backend API changes**. The drawer identity and secret word are derived entirely on the frontend from data that is already present in the `RoomSnapshot` returned by existing endpoints.

---

## Existing Endpoint Used (read-only)

### `GET /rooms/:code` — Fetch Room (unchanged)

The game screen uses this same endpoint (via the existing `roomStore.fetchRoom()` call) to hydrate its initial state after navigation. The response already contains all fields needed:

- `room.hostId` → drawer identity
- `room.availableWords[0]` → secret word
- `room.participants` → player list with names

**No changes to request shape, response shape, or error codes.**

---

## Frontend API Client (`frontend/src/services/api.ts`)

**No changes.** The existing `api.fetchRoom()` method is sufficient.

---

## UI Contract (what the game screen must show)

| Viewer Role | Word Area | Role Label in Player Info | Drawer Indicator |
|-------------|-----------|---------------------------|------------------|
| Drawer      | Secret word displayed prominently | "Drawer" | Own name marked "Drawer" |
| Guesser     | Neutral placeholder (no word) | "Guesser" | Drawer's name marked "Drawer" |

These are rendering requirements, not API contracts, since everything is derived client-side.
