# Research: Game Start & Drawer Flow

**Feature**: `002-game-start-drawer`  
**Date**: 2026-05-31

## R1 — Player name validation

**Decision**: Validate on both client and server. Trim with `.trim()`; reject if empty after trim with message `"Player name is required"`. Store trimmed name only.

**Rationale**: FR-001–FR-003 require clear errors and trimmed display. Client validation gives instant feedback; Zod on backend enforces contract. Remove `displayName()` fallback to `"Player"` for empty names.

**Alternatives considered**:
- Server-only validation — rejected; worse UX on forms.
- Default to `"Player"` — rejected; violates spec.

## R2 — Drawer assignment timing

**Decision**: Set `drawerId = hostId` inside `startGame()` when status becomes `"playing"`.

**Rationale**: Host is always drawer per spec assumption. Assignment at start keeps lobby logic unchanged from Scenario 1.

**Alternatives considered**:
- Separate “begin round” endpoint — rejected; redundant with existing start.

## R3 — Deterministic secret word

**Decision**: Index into `STARTER_WORDS` using sum of room code char codes modulo list length:

```text
index = (code[0] + code[1] + code[2] + code[3]) % STARTER_WORDS.length
secretWord = STARTER_WORDS[index]
```

**Rationale**: Same room code → same word across sessions (SC-005). Simple, testable, no randomness. Documented in plan for Vitest assertions.

**Alternatives considered**:
- Random selection — rejected; fails determinism.
- crypto hash — acceptable but heavier than needed for lab.

## R4 — Viewer-filtered snapshots

**Decision**: Extend `toRoomSnapshot(room, viewerParticipantId)`:

- Always include `drawerId` and `scores` when `status === "playing"`.
- Include `secretWord` only when `viewerParticipantId === drawerId`.
- Omit `availableWords` from playing snapshots (full list would leak answers).

**Rationale**: FR-008/FR-010 require guessers cannot see the word via polling. Existing `participantId` query param is the viewer hook (discovery A6).

**Alternatives considered**:
- Separate `/rooms/:code/word` endpoint — rejected; extra surface area.
- Client-side hide only — rejected; fails FR-010 if API leaks word.

## R5 — Scores at round start

**Decision**: Add `scores: Record<participantId, number>` on `Room`, initialized to `0` for every participant in `startGame()`. Expose in snapshot for Scoreboard.

**Rationale**: FR-009/SC-006. Scenario 3 will mutate scores on correct guesses.

## R6 — Game screen polling and route guard

**Decision**: Add ~2s polling on `GamePage` via `fetchRoom()` while `status === "playing"`. Redirect to `/lobby` if status is `lobby`; redirect to `/` if no session.

**Rationale**: Edge case: direct navigation and refresh must restore drawer/word state. Aligns with constitution polling model.

**Alternatives considered**:
- No game polling until Scenario 3 — rejected; drawer/word visibility after refresh needs sync.

## R7 — UI word display

**Decision**: Drawer sees word in a dedicated card/panel; guessers see “Guess the drawing!” without the word. Canvas/guess form remain placeholders until Scenario 3.

**Rationale**: Spec scope boundary explicitly allows placeholders for canvas/guessing.
