# Implementation Plan: Scribble Multiplayer Game

**Branch**: assignment

**Date**: 2026-06-04

**Spec**: speckit/spec.md

## Summary

Implement the missing multiplayer gameplay functionality for the Scribble starter application.

The implementation must support:

* Room setup and lobby synchronization
* Host assignment and host-only game start
* Drawer assignment and secret word visibility
* Drawing and guessing interactions
* Scoring and result display
* Restart flow

The solution must remain aligned with the provided business scenarios and project constitution.

---

## Technical Context

### Language

* TypeScript

### Frontend

* React
* Vite

### Backend

* Express
* Node.js

### Storage

* In-memory room store

### Synchronization

* HTTP polling (~2 second interval)

### Authentication

* Not used

### Database

* Not used

---

## Constitution Check

### Required Constraints

* Polling only
* No WebSockets
* No authentication
* No database
* Single round only
* Host acts as drawer
* Deterministic word selection
* Brownfield enhancement approach

### Result

All planned work complies with constitutional requirements.

---

## Discovery Findings

### Relevant Files

#### Backend

* backend/src/models/game.ts
* backend/src/services/roomStore.ts
* backend/src/api/rooms.ts

#### Frontend

* frontend/src/state/roomStore.ts
* frontend/src/services/api.ts
* frontend/src/pages/LobbyPage.tsx
* frontend/src/pages/GamePage.tsx
* frontend/src/components/GuessForm.tsx
* frontend/src/components/Scoreboard.tsx
* frontend/src/components/ResultPanel.tsx

### Identified Gaps

1. Host tracking missing
2. Polling missing
3. Game start flow missing
4. Drawer assignment missing
5. Secret word visibility missing
6. Drawing interaction missing
7. Guess submission missing
8. Scoring missing
9. Result state missing
10. Restart flow missing

---

## State Model Changes

### Room

Add:

* hostId
* gameStatus
* secretWord
* drawerId
* scores
* guesses
* drawingState

### Guess

Add:

* participantId
* participantName
* value
* timestamp
* isCorrect

### Result State

Add:

* winningWord
* finalScores
* guessHistory

---

## Data Flow

### Scenario 1

Create Room
→ Assign Host
→ Join Room
→ Poll Room State
→ Host Starts Game

### Scenario 2

Start Game
→ Assign Drawer
→ Select Secret Word
→ Show Word To Drawer Only

### Scenario 3

Drawer Draws
→ Save Drawing State

Guesser Submits Guess
→ Validate Guess
→ Update Score
→ Update Guess History

### Scenario 4

Round Ends
→ Display Results
→ Host Restarts
→ Clear Round State
→ Return To Lobby

---

## Testing Strategy

### Scenario 1

Verify:

* Host assignment
* Room isolation
* Polling updates
* Host-only start

### Scenario 2

Verify:

* Drawer assignment
* Secret word visibility

### Scenario 3

Verify:

* Drawing persistence
* Guess submission
* Guess synchronization
* Scoring

### Scenario 4

Verify:

* Result display
* Restart behavior
* Participant preservation

Testing will be performed using two browser sessions.

---

## Risks

### Polling Consistency

Polling clients may briefly observe stale room state.

### Shared State Complexity

Room updates must avoid leaking state between rooms.

### Feature Alignment

Implementation must remain aligned with assignment scope and avoid introducing out-of-scope features.
