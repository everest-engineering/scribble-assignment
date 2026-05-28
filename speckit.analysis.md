# Spec Kit Analysis: Scenario 3 Gameplay Interaction

**Created**: 2026-05-28
**Scope**: Scenario 3 only
**Inputs**: [speckit.discovery.md](file:///Users/manojprabhakarm/projects/work/scribble-assignment/speckit.discovery.md), [speckit.specify.md](file:///Users/manojprabhakarm/projects/work/scribble-assignment/speckit.specify.md), [speckit.plan.md](file:///Users/manojprabhakarm/projects/work/scribble-assignment/speckit.plan.md), [speckit.tasks.md](file:///Users/manojprabhakarm/projects/work/scribble-assignment/speckit.tasks.md)

## 1. Coverage Review

- **README Scenario 3 requirement:** Interactive drawing canvas, clear canvas, guess submission with validation, synced guess history via polling, deterministic scoring.
- **Specification coverage:** Covered by User Stories 7, 8, and 9 with acceptance criteria for drawer-only drawing, clear canvas, empty guess rejection, synced history, case-insensitive matching, and 100-point scoring.
- **Plan coverage:** Covers backend state model, snapshot shape, drawing/clear/guess endpoints, frontend API/store changes, Game page canvas work, guess form behavior, scoreboard, activity history, and styles.
- **Task coverage:** TSK034-TSK054 cover backend model/service/routes, frontend API/store/UI, tests, builds, and manual verification.

## 2. Consistency Findings

- **HTTP polling constraint:** Scenario 3 remains aligned with the no-WebSockets rule. Drawing, guesses, scores, and history sync through HTTP endpoints plus existing `/game` polling.
- **In-memory-only constraint:** Drawing strokes, guesses, and scores are planned as fields on the in-memory `Room` object. No database or persistence work is introduced.
- **Single-round scope:** The analysis/spec/plan avoid timers, drawer rotation, multiple rounds, and automatic result transitions. Result and restart behavior remain reserved for Scenario 4.
- **Secret word security:** Guess scoring happens on the backend using `secretWord`, while snapshots continue to mask the word for non-drawers.
- **Traceability:** Scenario 3 requirements map cleanly to FR-011 through FR-019, SC-007 through SC-010, and tasks TSK034 through TSK054.

## 3. Ambiguities Resolved

- **Drawing format:** Use serializable path/stroke data instead of image uploads or SVG strings. This keeps the payload typed, bounded, and compatible with in-memory snapshots.
- **Guess sync cadence:** Guess history and scores sync through the existing 2-second game polling interval. Guess submitters may update immediately from the submission response.
- **Repeated correct guesses:** A participant receives 100 points only for their first correct guess in the active round. Later correct guesses are recorded with 0 additional points.
- **Round end:** Scenario 3 does not end the round automatically after a correct guess. Result state is Scenario 4.

## 4. Implementation Risks

- **Payload size:** Drawing updates can grow quickly if every pointer movement is stored forever. The schema should bound stroke count, points per stroke, color length, and brush size.
- **Canvas responsiveness:** Updating the backend on every pointer move may be noisy. Prefer local immediate drawing and persist on stroke completion or a lightweight debounce.
- **Permission drift:** Backend checks must reject guesser drawing/clearing and drawer guess submissions even if the UI hides those controls.
- **Score duplication:** The service layer should calculate whether a participant already has a correct guess before awarding points.
- **Snapshot compatibility:** All room creation/start paths must initialize new gameplay fields so frontend components never receive `undefined` for drawing, guesses, or scores.

## 5. Readiness Decision

Scenario 3 is ready for implementation. The remaining work is implementation and verification, tracked by TSK034-TSK054 and CHK027-CHK054.
