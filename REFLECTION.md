# Reflection: Scribble Assignment

**Date**: 2026-06-12

## Overview

This document reflects on the implementation of the Scribble multiplayer drawing game across four features: lobby/host management, game rounds, drawing canvas, and guessing/scoring/game-end.

## What Went Well

1. **Spec-first workflow**: Following the specify → plan → tasks → implement → validate loop kept each feature focused and well-scoped. Every task was traceable to a spec requirement.

2. **Constitution adherence**: The strict No-WebSockets, No-Database, No-Authentication constraints were respected throughout, keeping the architecture simple and aligned with the assignment requirements.

3. **HTTP polling pattern**: Using a single `GET /rooms/:code` polling endpoint for all state (lobby, game, canvas, guesses, scores) reduced frontend complexity. The useEffect + setInterval polling pattern in `LobbyPage.tsx` and `GamePage.tsx` worked reliably.

4. **Incremental delivery**: Each feature built on the previous one. The lobby system had to work before game rounds, which had to work before the canvas, which had to work before guessing and scoring.

5. **Type safety**: TypeScript strict mode with Zod validation prevented payload-shape bugs across the frontend-backend boundary.

## Challenges

1. **Deterministic vs. random word selection**: The README for Scenario 2 requires "deterministic secret word selection," but spec-002 FR-012 Q&A clarified this as "source-deterministic" (fixed word list). The initial implementation used `Math.random()` for selection. The evaluation flagged this as non-deterministic, requiring a fix to make selection a deterministic function of the room code.

   *Lesson*: When the README and a spec clarification conflict, default to the stricter interpretation (the README's "deterministic" means algorithmically predictable).

2. **Canvas state management**: The drawing canvas required careful handling of stroke data — maintaining an in-memory array of strokes, clearing on new round, and serving full state on every poll. Edge cases like drawer disconnect mid-round needed special handling.

3. **Polling timing edge cases**: The 2s polling interval created subtle race conditions. For example, a guesser's correct guess response from `POST /guess` transitions the room to `"finished"`, but other players only discover this on their next poll cycle (up to 2s later). The spec's "within 2 seconds" requirement was met, but the asymmetry between the acting player and passive observers is worth noting.

4. **Room code collision**: The 4-character code generation had a theoretical collision risk. The `generateUniqueCode` loop handles this, but with many concurrent rooms, retries could degrade performance.

## Key Decisions and Their Outcomes

| Decision | Outcome |
|----------|---------|
| Single polling endpoint for all state | Simplified frontend; single poll interval, single response shape |
| First-correct-wins via status flip | Natural atomicity without locking; elegantly handles race conditions |
| Immediate score storage on correct guess | Consistent across all pollers; no read-time calculation needed |
| Host-only restart | Consistent with lobby management; avoids vote-based complexity |
| Secret word revealed on `status === "finished"` | Works for all participants symmetrically |

## What Could Be Improved

1. **Spec consistency**: The README's Scenario 2 and spec-002's FR-012 Q&A gave conflicting guidance on word selection. A spec consistency review before implementation would have caught this.

2. **More comprehensive edge-case testing**: The manual validation in quickstart.md covers the happy path well, but automated tests for edge cases (concurrent guesses, drawer disconnect, rapid restart) would increase confidence.

3. **Canvas performance**: The current implementation stores every stroke as a complete path object. For long drawing sessions, this could grow large. A more compact stroke format or stroke-count limit would help.

4. **Room cleanup**: The current implementation only cleans up rooms when the last participant leaves. A periodic sweep of abandoned rooms (e.g., inactive for >1 hour) would prevent memory leaks.

## Learning Outcomes

- Spec Kit artifacts (constitution, spec, plan, tasks) provide excellent structure but require careful cross-referencing to avoid internal contradictions.
- HTTP polling is a viable alternative to WebSockets for party-game latency requirements (2s tolerance), but it requires disciplined state management to avoid partial-update bugs.
- Deterministic algorithms are preferable to random ones for game mechanics that affect test reproducibility and player experience.

## Closing

The four features were implemented successfully with all functional requirements met. The evaluation revealed two missing artifacts (discovery and reflection) and one spec inconsistency (deterministic word selection), all of which are addressed in this patch. The project demonstrates a clean, spec-driven TypeScript implementation of a multiplayer drawing game using only HTTP polling and in-memory state.

**Total implementation scope**: 4 features, ~20 backend endpoints, ~15 frontend components, 0 database queries, 0 WebSocket connections.
