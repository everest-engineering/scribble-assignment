# Research: Result and Restart

**Feature**: Scenario 4 | **Date**: 2026-06-03

## Secret word reveal in result state

**Decision**: In `toRoomSnapshot`, when `room.status === "result"`, set `secretWord` to the actual word for all viewers; when `playing`, keep drawer-only masking.

**Rationale**: README Scenario 4 requires all players see the correct word; constitution snapshot purity allows this documented exception at result only.

**Alternatives considered**: Separate `revealedWord` field (rejected — redundant with secretWord when result); frontend-only reveal from winner guess text (rejected — incorrect if no correct guess path).

## Restart semantics (A4)

**Decision**: `restartRoom` sets `status = "lobby"`, deletes `currentRound` entirely, preserves `participants` and `hostParticipantId`; no score persistence.

**Rationale**: A4 literal reading; simplest lobby snapshot without round block.

**Alternatives considered**: Keep round for history (rejected — conflicts with "all round state cleared"); reset round in place (rejected — lobby should have no currentRound).

## Host-only restart

**Decision**: Mirror `startRound` permission model — `participantId === hostParticipantId`; reject with 403 otherwise; require `status === "result"` else 409.

**Rationale**: Consistent with Scenario 2 host gating; README implies host drives restart.

**Alternatives considered**: Any participant restart (rejected — not in README).

## Client navigation after restart

**Decision**: Host calls restart then `navigate("/lobby")`; GamePage `useEffect` redirects any tab when polled snapshot shows `status === "lobby"`; lobby polling already active on GamePage until navigate.

**Rationale**: A5 polling; no WebSocket push; host immediate navigation + guest poll within 2 s satisfies SC-004.

**Alternatives considered**: All tabs stay on game with lobby UI embedded (rejected — README says return to lobby).

## Guess history in result (Q1)

**Decision**: Reuse Scenario 3 guess list in `ResultPanel`; add prominent revealed-word card above scores.

**Rationale**: Q1 default already implemented in Scenario 3; Scenario 4 adds word banner and Play Again.

## Post-restart drawer (Q2)

**Decision**: Next `startRound` uses `participants[0]` as drawer per A2 — no rotation logic added.

**Rationale**: Q2 default; single-round lab scope.
