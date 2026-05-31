# Reflection

## What the Starter Provided

The starter gave a working room-creation and join flow backed by an in-memory `Map<string, Room>` on the Express side, with a React frontend that could navigate between a home page and a lobby. The lobby refreshed only on manual page load. The game screen, canvas, guess form, and scoreboard were all scaffolded but effectively dead — components existed as empty shells with no wired state or API calls. There was no host tracking, no game status, and no concept of a secret word or drawer.

## What I Built, Scenario by Scenario

**Scenario 1 — Room Setup and Lobby.** I added `hostId` to the room model so host identity could be enforced downstream. Join validation now rejects non-lobby rooms with a clear `409`. Room codes are normalised to uppercase at every entry point. Multi-room isolation was verified in tests — joining room A must not affect room B. The lobby polls every ~2 seconds so participants see each other without refreshing. The Start button is gated behind a host check and a minimum of two participants. I also fixed a planted bug: the frontend API base URL pointed to `http://localhost:3001/bug`, which silently broke every request.

**Scenario 2 — Game Start and Drawer.** I implemented drawer assignment (host becomes the drawer) and deterministic secret-word selection: the word is derived from a stable hash of the room code against a fixed word list, so the same room code always resolves to the same word without any `Math.random`. Snapshots became viewer-scoped — the drawer receives `secretWord`, guessers receive a `wordPlaceholder` of underscores, and neither field leaks to the other.

**Scenario 3 — Gameplay Interaction.** Guesses are submitted via `POST /rooms/:code/guess`, trimmed, compared case-insensitively, and appended to an ordered `Guess[]` on the room. Empty or whitespace-only guesses are rejected before they reach the service layer. The first correct guess awards 100 points, transitions the room to `"ended"`, and reveals the secret word to all viewers. The drawing canvas is entirely local — pointer events draw to a `<canvas>` element with no server transmission, and a Clear button wipes it. All guess history and scores flow back via the existing poll so every participant's screen updates within ~2 seconds.

**Scenario 4 — Result View and Restart.** When the room reaches `"ended"`, the game screen replaces active-game content with a result view: the secret word displayed prominently, a scoreboard, and the full ordered guess history. The host sees a Restart button; non-hosts do not. Restart calls `POST /rooms/:code/restart`, which clears all round state (`drawerId`, `secretWord`, `guesses`, `scores`) and returns the room to `"lobby"` with participants preserved. The polling loop already running on the game screen detects `status === "lobby"` and navigates everyone back to the lobby automatically.

## Spec Kit Workflow

I ran the full constitution → specify → clarify → plan → tasks → implement → validate loop once per scenario, keeping all four scenarios on a single branch for a single PR. Each scenario's `specs/00N-*/` folder holds the complete paper trail: spec, plan, research, data model, contracts, quickstart, and tasks. No production code was written before its behaviour was captured in a spec.

## AI Usage and Review Discipline

AI drafted all artifacts and code, but every diff went through a line-by-line review before commit. That review caught real problems. The `availableWords` field in the snapshot was being sent to guessers with the full word list, which would have let anyone deduce the secret word by checking which candidate matched the placeholder length — a word leak. The fix was to return an empty array for active-room guesser snapshots. A plan artifact also referenced a wrong API path that wasn't in the spec, and a proposed route test would have pulled in a test-only HTTP dependency that the constitution doesn't justify. Catching these before they landed in a commit is exactly the point of the review gate described in Principle IX.

## Deliberate Tradeoffs

The canvas does not broadcast strokes to other participants. Real-time drawing requires either WebSockets (explicitly forbidden) or polling at a sub-second cadence that would overwhelm the ~2s REST model. In a production game I would sync strokes over a socket connection; here, guessers see a static placeholder and must imagine the drawing from context.

There is no leave-room or disconnect endpoint. A participant who navigates away stays in the participant list through any number of restarts, consistent with the ephemeral-identity assumption established in Scenario 1. Cleaning up departed participants would require heartbeats or TTLs — both add complexity that no spec requirement justified.

Player-name validation (trim, non-empty, max length) was pulled into Scenario 1 because names are entered at room creation and join, so the validation belongs there rather than being deferred to a later scenario and retrofitted.
