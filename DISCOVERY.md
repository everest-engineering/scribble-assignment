# Discovery: Scribble Assignment

**Created**: 2026-06-08 | **Last Updated**: 2026-06-12

## Purpose

This document captures gaps, assumptions, constraints, and unknowns discovered during the initial analysis of the Scribble multiplayer drawing game specification.

## Gaps

| # | Gap | Impact | Resolution |
|---|-----|--------|------------|
| G1 | The phrase "deterministically selected from the starter list" in Scenario 2 is ambiguous — does it mean the *source list* is fixed (source-deterministic) or the *selection algorithm* is predictable (algorithm-deterministic)? | Affects secret word selection in `startGame` | Clarified in spec-002 Q&A: "deterministically" refers to the fixed source list; selection may be random. However, the final evaluation requires algorithm-deterministic selection (same room code always produces the same word). See [#fix-deterministic-word]. |
| G2 | No timeout or forced round-end mechanism is specified. If no one guesses correctly, the round persists indefinitely. | Affects game completion guarantee | Documented as out-of-scope for v1 in spec-004 assumptions. |
| G3 | Canvas state persistence and cleanup on round restart is not fully specified. | Affects restart flow completeness | Implemented by setting `canvasState = null` in `resetRoomToLobby`. |
| G4 | No explicit spec for what happens when the drawer leaves mid-round. | Leaves a gap in leave-room flow | Implemented as: if drawer leaves while `status === "playing"`, transition room to `"finished"` with `winnerId: null`. |
| G5 | The maximum participant count per room is not specified. | Affects scale assumptions | Left unbounded per backend in-memory model; practical limit of ~20 concurrent users per room documented in plans. |

## Assumptions

| # | Assumption | Rationale | Status |
|---|------------|-----------|--------|
| A1 | Single round per game session (no score accumulation across rounds) | Stated explicitly in spec-004 assumptions | ✅ Implemented — scores reset on restart |
| A2 | Drawer does not receive points in v1 | Stated in spec-004 assumptions | ✅ Implemented |
| A3 | First correct guess ends the round immediately | Stated in spec-004 clarifications | ✅ Implemented |
| A4 | Restart is host-only (not vote-based) | Consistent with lobby management spec | ✅ Implemented |
| A5 | Scoring is simple: correct = 100 pts, incorrect = 0 | Stated in spec-004 assumptions | ✅ Implemented |
| A6 | HTTP polling at 2s interval is sufficient for state sync | Consistent with constitution Principle III | ✅ Implemented |
| A7 | In-memory state is sufficient (no database) | Per constitution Principle IV | ✅ Implemented |
| A8 | Room codes use a 4-character alphanumeric scheme excluding ambiguous characters (I, O, 0, 1) | Standard practice for join codes | ✅ Implemented |

## Constraints

- No WebSockets, Socket.io, or real-time push protocols (Constitution III)
- No database (Constitution IV)
- No authentication, sessions, JWT, or OAuth (AGENTS.md)
- TypeScript strict mode with Zod validation (Constitution I)
- Brownfield enhancement only — no rewrites (Constitution II)

## Unknowns

- How simultaneous correct guesses in the same tick should be ordered (resolved: winner is based on server processing order)
- Whether the canvas should display existing strokes for late-joining players (resolved: yes, via polling full canvas state)
- How the host is determined after the original host leaves (resolved: first participant in the list becomes host)

## References

- Constitution: `.specify/memory/constitution.md`
- Feature specs: `specs/001-lobby-host-management/` through `specs/004-guessing-scoring-game-end/`
- README: `README.md` (defines Scenario 2 requirements including deterministic word selection)
