# Contracts: Host Start Control

**Phase**: 1 | **Date**: 2026-07-06

## No New Contracts

This feature introduces no new API endpoints, data types, or external interfaces. It uses existing contracts exclusively:

1. **`RoomStore.participantId`** — stored from `RoomSessionResponse` on create/join. Identifies the current user.
2. **`RoomSnapshot.participants`** — array of `Participant` with `isHost` flag. Used to find current user's host status and count players.
3. **`GET /rooms/:code`** — existing endpoint, polled by Feature 004. Returns room state with participants.

## Internal Contract (LobbyPage ↔ RoomStore)

| State | Access | Purpose |
|---|---|---|
| `participantId` | `roomStore.getSnapshot().participantId` | Identify current user |
| `room.participants` | `roomStore.getSnapshot().room.participants` | Find isHost + count players |
| `room.status` | `roomStore.getSnapshot().room.status` | Verify still in lobby |
