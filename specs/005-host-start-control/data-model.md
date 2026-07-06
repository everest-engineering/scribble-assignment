# Data Model: Host Start Control

**Phase**: 1 | **Date**: 2026-07-06 | **Input**: Research findings + feature spec

## Changes

**No data model changes.** All required data is already available:

- `Participant.isHost` — set by Feature 001, used to identify the host
- `Room.participants[]` — array of participants, `.length` used for minimum player check
- `RoomStore.participantId` — the current user's participant ID, used to look up their own participant object

## No New Entities, Fields, or Validation Rules

All conditions are derived from existing state. The feature is purely a rendering change in `LobbyPage.tsx`.
