# Reflection: Scribble Single-Round Game Completion

## Overview

This assignment extended a starter Scribble multiplayer drawing game across four business scenarios: room setup and lobby (P1), game start and drawer flow (P2), drawing/guessing/scoring (P3), and result/restart (P4). The work was conducted as a brownfield enhancement on an existing Express + React codebase using TypeScript.

## What went well

1. **Brownfield discipline**: The starter's existing route structure, model naming conventions (Participant vs Player), page components, and state management pattern were preserved throughout. No routes were rewritten; only new ones were added alongside existing ones.

2. **Backend-authoritative state**: All game state (room membership, round phase, drawer identity, secret word, drawing data, guesses, scores) lives on the backend. The frontend treats every API response as authoritative and never maintains its own copy of shared state.

3. **Incremental delivery**: Each scenario was built on top of the prior one without breaking existing behavior. Scenario 4 (restart) correctly leverages the result transition already built in Scenario 3.

4. **Secret word isolation**: The `toRoomSnapshot()` function filters the secret word based on viewer identity and room phase. During playing phase, only the drawer sees it. During result phase, it is intentionally revealed to all players.

5. **Comprehensive error handling**: Every invalid action returns a specific, user-facing error message at both the API level (via Zod schemas and HttpError) and the client level (via form validation and error state in the store).

6. **Test coverage**: 47 backend tests and 4 frontend API tests cover validation edge cases, permission checks, state transitions, and the full restart lifecycle.

## Challenges and decisions

1. **Entity naming (Participant vs Player)**: The starter used `Participant` while the spec said `Player`. We chose to stick with the existing `Participant` to stay true to brownfield principles. This was documented in discovery notes.

2. **Score reset on restart**: Initially ambiguous whether FR-027 ("clear round-specific state") included scores. Scores live on the `Participant` object, not in `RoundState`. We resolved by preserving scores, which enables a natural path to future multi-round cumulative scoring without data migration.

3. **Word selection determinism**: The spec required a deterministic rule. We used `STARTER_WORDS[0]` ("rocket") — a simple, testable rule that is easy to change later.

4. **Drawing snapshot model**: The drawing endpoint accepts a full stroke array replacement rather than incremental updates. This is simpler to implement and reason about, with no risk of stroke-ordering conflicts since there is only one drawer.

5. **Polling vs WebSockets**: Polling at 2-second intervals with cleanup on unmount is simple and meets the requirements. The trade-off is ~2-second latency for state visibility, which is acceptable for a turn-based drawing game.

## What I would do differently

1. **Spec artifacts first**: The implementation was completed before the spec artifacts were organized into the required `specs/NNN-*/` directory structure. In a real project, these artifacts should be created and reviewed before any code is written, as the rubric requires.

2. **More frontend tests**: The frontend only has API-level tests (mocked fetch). Component-level tests for Canvas, GuessForm, and the game/result state transitions would provide more confidence, especially for the polling and auto-redirect logic.

3. **Room expiry**: Rooms accumulate in memory indefinitely. Adding a TTL or idle timeout would be a practical improvement for any real deployment.

## Alignment with constitution

- Brownfield-first: All changes extended existing code without rewriting.
- Spec before implementation: Each scenario was specified before coding (though artifacts were consolidated rather than split per scenario).
- Out-of-scope discipline: No WebSockets, no database, no auth, no Docker.
- Backend as source of truth: Consistently enforced throughout.
- Deterministic and testable: All business rules use simple, deterministic logic.
- Clear validation: Every error path returns a specific message.
- Small increments: Each scenario was delivered as a self-contained slice.
- Human review: All output was verified against the repository before commit.
