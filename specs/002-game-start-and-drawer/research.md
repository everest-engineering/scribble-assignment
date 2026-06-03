# Research: Game Start and Drawer

**Feature**: Scenario 2 | **Date**: 2026-06-03

## Word selection (A1)

- **Decision**: `word = STARTER_WORDS[(sumCharCodes(code) + roundIndex) % STARTER_WORDS.length]` with `roundIndex = 0` on first start.
- **Rationale**: Matches discovery.md A1 and README deterministic requirement; reproducible for grading.
- **Alternatives considered**: `Math.random()` — rejected by constitution; hash of UUID — harder for manual verification.

## Drawer assignment (A2)

- **Decision**: `drawerParticipantId = room.participants[0].id` (host).
- **Rationale**: README "host (or first player)"; creator is always index 0.
- **Alternatives considered**: Random drawer — forbidden; rotate on restart — deferred to Scenario 4 (Q2: no rotation in Scenario 2 scope).

## Snapshot masking (G6)

- **Decision**: `toRoomSnapshot(room, viewerParticipantId)` sets `currentRound.secretWord` to the real word only when `viewerParticipantId === drawerParticipantId`; otherwise `null`. Expose `viewer.isDrawer` for UI.
- **Rationale**: Single serializer gate per constitution Principle I.
- **Alternatives considered**: Separate `/drawer-word` endpoint — bypasses snapshot purity.

## Start authorization

- **Decision**: `POST /rooms/:code/start` body `{ participantId }`; must equal `hostParticipantId`; room must be `lobby`; `participants.length >= 2`.
- **Rationale**: Aligns with Scenario 1 host model; 403 for non-host, 409 for wrong status or insufficient players.
- **Alternatives considered**: Session cookies — out of scope (no auth).

## Frontend start flow

- **Decision**: Host clicks Start → `roomStore.startGame()` → on success `navigate("/game")`; failures show `error.message`.
- **Rationale**: Replaces G7 navigate-only behavior.
- **Alternatives considered**: Navigate first then start — race for guessers seeing lobby.

## Game page polling

- **Decision**: Reuse `useRoomPolling` + `fetchRoomPoll` on `GamePage` when `room.status === "playing"`.
- **Rationale**: A5 single hook; guessers see status/word masking updates without manual refresh.
