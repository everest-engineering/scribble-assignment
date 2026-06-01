# Research: Round Results and Lobby Restart

**Feature**: `004-result-restart-lobby` | **Date**: 2026-06-01

## R1: Round end trigger

- **Decision**: Inside `submitGuess`, after recording a **correct** guess, if `room.status === "drawing"`, set `status = "result"` and copy `secretWord` to `revealedWord` for all viewers.
- **Rationale**: FR-001; first correct only (check status before transition).
- **Alternatives**: Separate host “end round” action (rejected by clarifications).

## R2: Guess lock after result

- **Decision**: Reject new guesses with 409 when `status !== "drawing"`.
- **Rationale**: Edge case—second correct guess must not change outcomes.

## R3: History on restart

- **Decision**: On restart, move `guesses` to cleared; lobby shows no prior-round list; result screen used `roundGuesses` snapshot field optional—or keep `guesses` until restart then clear.
- **Rationale**: FR-011; FR-004 needs full history while in result (keep until restart).

## R4: Join during result

- **Decision**: `joinRoom` allows `lobby` and `result`; still rejects `drawing`.
- **Rationale**: FR-014; aligned with 001 FR-015 clarification.

## R5: Navigation

- **Decision**: `GamePage` and `LobbyPage` polls: if `status === "result"` → `navigate("/results")`; after restart `status === "lobby"` → `navigate("/lobby")`.
- **Rationale**: FR-015, FR-009; ~2s poll interval.
