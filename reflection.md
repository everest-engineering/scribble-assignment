# Reflection: Scribble Assignment Delivery

## What I Built

I implemented the four required Scribble game scenarios end to end across the Express backend and React frontend, preserving the provided monorepo structure and TypeScript-first approach.

1. Room setup and lobby management:
- Added room creation and join flows with server-side validation for player names and room state constraints.
- Implemented host tracking and host-only game start permissions.
- Added lobby polling and state hydration so all players see a consistent room snapshot.

2. Game start and drawer setup:
- Implemented transition from lobby to active game with deterministic word selection behavior.
- Added drawer assignment and ensured only the drawer can see the chosen word while guessers receive masked game state.
- Enforced start-state guards so invalid transitions are rejected with clear API errors.

3. Gameplay interaction:
- Implemented drawing submission and synchronized polling updates for all room participants.
- Added guess submission with server validation and normalized guess handling.
- Built shared guess history and score updates so clients remain consistent without real-time push protocols.
- Ensured all synchronization remains HTTP polling based (no WebSockets).

4. Results and restart:
- Implemented round/game completion snapshots including final scores, correct word reveal, and guess history.
- Added host-driven restart/reset logic that clears round-specific state while preserving room and player identity.
- Added state transition checks to prevent gameplay mutations in result state.

## Engineering Approach

I followed a brownfield implementation strategy to extend existing starter code rather than refactor foundational flows. I prioritized strict typing, state transition correctness, and traceability to the scenario requirements.

Key principles I applied:
- TypeScript-first contracts for requests/responses and internal service models.
- Frontend and backend input validation (clear UX errors on frontend, authoritative enforcement on backend).
- Small, focused changes in existing folders (`backend/src/api`, `backend/src/services`, `backend/src/models`, `frontend/src/state`, and related UI components).
- Polling-compatible state snapshots designed for eventual consistency between players.

## Validation and Quality

I continuously verified behavior through local multiplayer manual testing and scenario-by-scenario checks:
- Host creates room, players join, lobby state remains synchronized.
- Host starts game, drawer receives private word, guessers do not.
- Drawing and guesses propagate through polling updates, with score changes reflected to all participants.
- Results screen shows the correct aggregate information and restart returns clients to a clean lobby state.

I also added/updated validation and error responses for invalid actions such as:
- Non-host attempting host-only actions.
- Actions attempted in the wrong phase.
- Invalid payload shapes or missing required fields.

## Spec Kit and Process Reflection

I updated and maintained Spec Kit artifacts throughout implementation:
- Constitution
- Specification
- Plan
- Tasks

This helped keep implementation grounded in acceptance criteria and reduced scope drift. The task breakdown was especially useful for sequencing backend state transitions before frontend integration.

## Tradeoffs and Constraints

Given assignment constraints, I intentionally avoided:
- WebSockets or socket-based push
- Databases/persistent storage
- Authentication/session systems

All room and game state is in-memory and scoped for assignment execution. This keeps implementation simple and aligned with constraints, while introducing expected limitations (state resets on server restart, single-instance memory scope).

## What I Would Improve Next

If I had additional time beyond assignment scope, I would prioritize:
- More exhaustive automated tests for state-machine edge cases and concurrent polling races.
- Explicit game-state transition diagrams in docs for faster onboarding.
- Additional frontend resilience polish (retry/backoff UX, clearer transient error messaging).
- Lightweight observability hooks for room lifecycle metrics and cleanup verification.

## Outcome

The delivered implementation satisfies the required four gameplay scenarios, preserves the prescribed architecture, enforces assignment constraints, and provides clear evidence through updated specs and end-to-end behavior verification.
