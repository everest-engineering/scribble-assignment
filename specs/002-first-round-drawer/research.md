# Research: First Round Drawer and Secret Word

**Feature**: `002-first-round-drawer` | **Date**: 2026-06-01

## R1: Deterministic word selection

- **Decision**: `selectRoundWord(roomCode, roundNumber)` — sum char codes of uppercase room code plus round number, modulo `STARTER_WORDS.length`.
- **Rationale**: Constitution forbids randomness for core rules; stable inputs yield stable word (FR-009, SC-005).
- **Alternatives**: Random index (rejected); always first word (rejected—fails variety).

## R2: Round-one drawer

- **Decision**: Host participant is drawer when `hostParticipantId` is set; else participant with earliest `joinedAt`.
- **Rationale**: Matches spec FR-006, FR-007 and user description “host (or first player)”.
- **Alternatives**: Rotate drawer (out of scope for round one).

## R3: Secret word in API

- **Decision**: Include `secretWord` only on `viewer` object when `viewer.role === "drawer"`.
- **Rationale**: FR-010/FR-011; guessers receive role and prompts without answer.
- **Alternatives**: Separate `/word` endpoint (rejected—extra leak surface).

## R4: Name validation at start

- **Decision**: On `startGame`, trim every participant name in place; if any empty after trim, abort 400 with message.
- **Rationale**: FR-003 ensures round does not begin with invalid roster.
- **Alternatives**: Only validate host (rejected—spec requires all participants).
