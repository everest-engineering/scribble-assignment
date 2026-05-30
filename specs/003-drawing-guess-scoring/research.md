# Research: Scenario 3 Gameplay Interaction

## Decision: Store canvas and guess history inside the active round state

**Rationale**: Scenario 3 extends the same single active round introduced in
Scenario 2. Keeping drawing data, guesses, and score totals on the room's round
state preserves atomic snapshots, avoids coordination between separate stores,
and keeps fetch responses stable across polling refreshes.

**Alternatives considered**:

- Separate drawing store keyed by room code
  Rejected because it splits one room lifecycle across multiple in-memory
  structures without adding value.
- Reconstruct guess history from transient frontend state
  Rejected because multiplayer synchronization must remain backend-authoritative.

## Decision: Represent drawing as normalized ordered strokes

**Rationale**: Ordered strokes made of normalized points are deterministic,
compact enough for small in-memory rooms, and independent from exact browser
canvas dimensions. The frontend can redraw the same stroke data at different
viewport sizes without the backend knowing about pixels.

**Alternatives considered**:

- Store raw bitmap image blobs
  Rejected because payload size grows quickly and ties the backend to rendering
  details.
- Store arbitrary free-form drawing commands
  Rejected because they are harder to validate and less predictable than points.

## Decision: Keep gameplay mutations on the existing rooms router

**Rationale**: Drawing, clearing, and guessing all mutate the active room state.
Adding room-scoped actions under the existing rooms API keeps authorization,
room lookup, and snapshot return behavior consistent with create/join/start.

**Alternatives considered**:

- Add a separate gameplay router
  Rejected because the feature does not justify a new top-level API surface.
- Send drawing updates only through fetch polling without explicit mutation
  endpoints
  Rejected because the client still needs explicit commands to change room state.

## Decision: Validate and normalize guesses at the API boundary

**Rationale**: Scenario 3 requires trimming guesses and rejecting blank input.
Enforcing those rules before the room store runs keeps invalid guesses out of
history and ensures gameplay logic always receives a normalized value.

**Alternatives considered**:

- Validate guesses only in the frontend form
  Rejected because backend correctness cannot depend on client behavior.
- Accept blank guesses and score them as incorrect
  Rejected because the specification requires empty-guess rejection.

## Decision: Reject drawer guess submissions and score accepted guesses at write time

**Rationale**: The drawer already knows the secret word and should not create
guess history noise or self-score. Scoring accepted guesses at submission time
creates stable history entries and stable per-player totals for all later fetches.

**Alternatives considered**:

- Allow the drawer to submit guesses
  Rejected because it undermines the drawer-vs-guesser gameplay split.
- Recompute scores on every fetch
  Rejected because it increases repeated work and makes history less explicit.

## Decision: Extend viewer-specific snapshots instead of adding a second gameplay payload

**Rationale**: Scenario 2 already established viewer-specific room snapshots.
Adding canvas state, guess history, score totals, and viewer permissions to the
same payload keeps the frontend integration simple and preserves drawer-only
secret-word visibility without adding a parallel contract.

**Alternatives considered**:

- Add separate endpoints for canvas, history, and scores
  Rejected because the frontend would need to coordinate multiple polls for one
  game screen.
- Send the same gameplay controls to every client and hide them only in the UI
  Rejected because backend permissions should remain authoritative.

## Decision: Use action response + polling for synchronization

**Rationale**: The acting tab should receive the updated room snapshot
immediately after drawing, clearing, or guessing, while other tabs catch up via
the existing 2-second polling flow. This preserves responsiveness without
introducing forbidden realtime transport.

**Alternatives considered**:

- Wait for polling even on the acting tab
  Rejected because it makes direct interactions feel laggy without any benefit.
- Introduce push updates for canvas sync
  Rejected because the constitution forbids realtime transports.
