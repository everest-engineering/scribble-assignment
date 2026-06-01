# Tasks: Room Hosting & Lobby

**Input**: Design documents from `/specs/002-room-hosting-lobby/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/`

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic feature-level configuration

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core backend changes that MUST be complete before user stories

- add host assignment on createRoom
- persist participant `role` and `hostId`
- reject joins when room `status !== 'lobby'`
- add `startGame(code: string, participantId: string)` that enforces host-only + min players
- read `ROOM_TTL_MS` and expose a `cleanupInactiveRooms()` function
- backend/src/services/roomStore.test.ts (extend with host, startGame, cleanup tests)

\*\*\* End Patch
