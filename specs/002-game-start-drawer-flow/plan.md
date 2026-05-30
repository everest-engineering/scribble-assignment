# Implementation Plan: Game Start and Drawer Flow

**Branch**: `assignment` | **Date**: 2026-05-31 | **Spec**: `specs/002-game-start-drawer-flow/spec.md`

## Summary

Implement game start after lobby readiness: validate player names before room membership, enforce host-only start, assign the host or first player as drawer, choose a deterministic secret word from the starter list, and expose that word only to the drawer during active play.

## Technical Context

**Storage**: Existing in-memory room state.

**Sync**: HTTP fetch/polling only.

**Constraints**: No multiple rounds, drawer rotation, timers, bonuses, WebSockets, databases, or authentication.

## Key Endpoint

- `POST /rooms/:code/start`: validates host and two-player minimum, initializes the first round, assigns drawer, and selects word.

## Data Flow

1. Host starts from lobby.
2. Backend validates host and player count.
3. Backend initializes round state with drawer id and secret word.
4. Room snapshot reveals `secretWord` only when the viewer is the drawer.

## Validation

- Empty names are rejected before create/join.
- Host starts a two-player room successfully.
- Non-host start is rejected.
- Drawer is clearly identified.
- Drawer sees the secret word; guessers do not.
