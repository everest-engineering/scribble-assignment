# Data Model: Automatic Lobby Polling

**Phase**: 1 | **Date**: 2026-07-06 | **Input**: Research findings + feature spec

## Changes

**No data model changes.** This feature is purely a frontend UX enhancement that uses existing types and APIs:

- `RoomSnapshot.status` — existing field, used to detect status transition from "lobby" to "playing"
- `RoomStore.fetchRoom()` — existing method, called by the polling interval
- `RoomStore.setRoomSnapshot()` — existing method, updates state with poll results

## No New Entities, Fields, or Validation Rules

All data flows through existing interfaces. The polling logic is self-contained within `LobbyPage.tsx`.
