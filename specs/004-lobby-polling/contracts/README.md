# Contracts: Automatic Lobby Polling

**Phase**: 1 | **Date**: 2026-07-06

## No New Contracts

This feature introduces no new API endpoints, no new data types, and no new
external interfaces. It relies entirely on existing contracts:

1. **`GET /rooms/:code`** — existing endpoint returning `{ room: RoomSnapshot }`.
   Used by `RoomStore.fetchRoom()`. No changes.

2. **`RoomStore.fetchRoom()`** — existing method. Returns `RoomSnapshot`.
   Signature: `async fetchRoom(): Promise<RoomSnapshot | null>`

3. **`RoomSnapshot.status`** — existing field (`"lobby" | "playing" | ...`).
   Polling code checks this to detect status transitions.

## Internal Contract (LobbyPage ↔ RoomStore)

The polling `useEffect` in `LobbyPage` relies on:

| Method/State | Direction | Purpose |
|---|---|---|
| `roomStore.fetchRoom()` | Call | Trigger poll request |
| `roomStore.getSnapshot().room` | Read | Access current room (code, status) |
| `roomStore.getSnapshot().isLoading` | Read | Check if poll is in-flight |
| `roomStore.subscribe()` | Subscribe | Re-render on state change |
| `navigate("/game")` | Call | Navigate on status change |
| `navigate("/", { replace: true })` | Call | Navigate on 404 |
