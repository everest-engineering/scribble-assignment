# Research: Phase 1 Room Lobby Setup

## Decision: Keep the existing 4-character easy-to-read room-code format

Rationale: The starter already generates four-character codes from an alphabet that
avoids ambiguous characters. Reusing that rule keeps join validation precise,
matches the approved clarification, and avoids unnecessary UI or API churn.

Alternatives considered:

- Longer room codes: lower collision probability but worse usability for the lab.
- Letters-only codes: simpler regex but diverges from the current generator.
- Variable-length codes: adds complexity without Phase 1 value.

## Decision: Represent host authority directly on the room object

Rationale: Adding `hostId` to `Room` keeps start permission deterministic and easy
to read inside the service layer. It fits the constitution requirement that room
state stay minimal and explicit.

Alternatives considered:

- Infer host from participant order only: simpler initially, but less explicit and
  more fragile once state transitions grow.
- Separate host metadata store: unnecessary duplication for in-memory Phase 1.

## Decision: Widen room status to `lobby | playing`

Rationale: Phase 1 only needs one additional transition beyond the existing lobby.
This is enough to support start gating and synchronized client navigation without
pulling in later gameplay concepts.

Alternatives considered:

- Keep a boolean `started`: works, but `RoomStatus` is already the right domain
  concept and scales better to later phases.
- Introduce future statuses now: premature and out of scope.

## Decision: Poll the lobby every 2 seconds and pause when the tab is hidden

Rationale: Polling meets the Phase 1 requirement without WebSockets. Pausing while
the page is backgrounded avoids waste and reduces the chance of overlapping timers
after navigation.

Alternatives considered:

- Manual refresh only: does not satisfy the spec.
- Polling faster than 2 seconds: more churn without user benefit.
- Polling at app-shell level: over-broad for a lobby-only requirement.

## Decision: Preserve the last valid roster on transient refresh failures

Rationale: The spec explicitly calls for clear feedback without blanking the roster.
Keeping the last known good room snapshot provides stable UX while still surfacing
the refresh problem.

Alternatives considered:

- Clear the room snapshot on refresh error: creates unnecessary flicker and loses
  useful context.
- Ignore errors entirely: hides operational issues from the player.

## Decision: Validate names in both the form layer and the API layer

Rationale: Frontend validation gives immediate feedback for whitespace-only names,
while backend Zod validation preserves correctness for direct API callers and stale
clients. The rules remain simple: trim and require at least one visible character.

Alternatives considered:

- Frontend-only validation: poor defense in depth.
- Backend-only validation: correct but weaker user experience.
