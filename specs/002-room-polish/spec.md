# Feature Specification: Room UI Polish

**Feature Branch**: `002-room-polish`  
**Created**: 2026-06-01  
**Status**: Draft  
**Depends On**: `001-gameplay-flow`  
**Input**: Feedback from gameplay testing showing UI/UX gaps in room flows and game state transitions.

## Overview

Following successful implementation of core gameplay loops in `001-gameplay-flow`, this feature improves the user experience by adding visual feedback, clearer error handling, better state transitions, and accessibility enhancements. The goal is to make the room and game experience feel polished and predictable without changing game rules or data models.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Visual Feedback & Loading States (Priority: P2)

Players see clear indication of what's happening during async operations (joining, starting, polling).

**Why this priority**: Players are uncertain whether the app is responding, leading to multiple clicks or page reloads.

**Independent Test**: Create a room, see "loading" state; join from another tab and observe "joining..." feedback; start game and confirm state change animation.

**Acceptance Scenarios**:

1. **Given** a player clicks "Create Room", **When** the request is in flight, **Then** the button is disabled with a spinner and the page shows a "Creating room..." message.
2. **Given** a player enters a room code and clicks "Join", **When** the join request is processing, **Then** the join button is disabled and a loading indicator appears.
3. **Given** the lobby is auto-polling, **When** a new player joins the room, **Then** the player list updates with a subtle animation or highlight.
4. **Given** the host clicks "Start Game", **When** the round begins, **Then** the page smoothly transitions to the game view (no hard reload) and the drawer assignment is clearly announced.

---

### User Story 2 - Error Recovery & Retry Logic (Priority: P2)

When network errors or invalid operations occur, players see actionable error messages and can retry.

**Why this priority**: Network failures and edge cases currently leave players stuck; recovery should be self-service.

**Independent Test**: Disconnect network during polling, observe error message; reconnect and retry; verify room state recovers correctly.

**Acceptance Scenarios**:

1. **Given** a polling request fails (network error, server offline), **When** the error occurs, **Then** the UI displays "Connection lost. Retrying..." and automatically retries every 3 seconds.
2. **Given** polling has failed for >15 seconds, **When** no recovery occurs, **Then** the UI shows a "Room connection lost. Return to start?" link allowing the player to exit gracefully.
3. **Given** a player tries to join an expired or invalid room, **When** the join fails with 404, **Then** the error message says "Room not found. Check the code and try again."
4. **Given** a player submits an empty guess by accident, **When** the guess form rejects it, **Then** a clear inline error appears ("Guess cannot be empty") and the form stays open for retry.

---

### User Story 3 - Game State Clarity (Priority: P2)

Players always know whose turn it is, who is drawing, and what action is expected of them.

**Why this priority**: Players are confused about role assignment and expected actions during gameplay.

**Independent Test**: Start a game, verify drawer is announced; switch to guesser tab and confirm prompt is different.

**Acceptance Scenarios**:

1. **Given** a round is active, **When** a player views the game page, **Then** a clear header announces whether they are the "Drawer" or "Guessing" (with styling difference).
2. **Given** the player is the drawer, **When** the game is active, **Then** they see "You are drawing: [SECRET_WORD]" in a highlighted box and a "Draw here" canvas placeholder (future feature).
3. **Given** the player is a guesser, **When** the game is active, **Then** they see "Guess the word!" and the guess form is prominent.
4. **Given** a round has ended, **When** all players view the result screen, **Then** the screen clearly shows "[PlayerName] was drawing [WORD]" and displays the final guess history and scores.

---

### User Story 4 - Copy & Share Room Code (Priority: P3)

Players can easily copy the room code to share with others.

**Why this priority**: Sharing room codes with friends should be frictionless.

**Independent Test**: Create a room, click "Copy Code" button, verify code is in clipboard and can be pasted.

**Acceptance Scenarios**:

1. **Given** a player is in the lobby, **When** they click the room code badge, **Then** the code is copied to clipboard and a "Copied!" tooltip appears for 2 seconds.
2. **Given** the code is copied, **When** a friend pastes it into the join form, **Then** the join succeeds without additional steps.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-101**: The app MUST show a loading state (disabled button, spinner, or progress bar) during all async operations (create, join, start, guess submission, polling).
- **FR-102**: Polling failures MUST trigger automatic retry every 3 seconds for up to 15 seconds, after which a "connection lost" message is shown.
- **FR-103**: Join failures (invalid code, room not found) MUST display specific error messages (not generic "Error occurred").
- **FR-104**: Guess submission MUST validate input client-side before sending; empty guesses MUST show inline error without sending to server.
- **FR-105**: The game page MUST clearly identify whether the current player is the drawer or a guesser, with distinct visual styling.
- **FR-106**: The drawer MUST see the secret word in a prominently highlighted box.
- **FR-107**: Guess form MUST be disabled and hidden if the player is not a guesser (e.g., if they are the drawer).
- **FR-108**: The result screen MUST display "X was drawing Y" (drawer name and secret word) and show final guess history and scores.
- **FR-109**: Room code badge MUST support one-click copy-to-clipboard with visual confirmation ("Copied!").
- **FR-110**: All form inputs MUST disable the submit button during request processing.

### Constraints

- No changes to backend API (room snapshots and endpoints remain as defined in 001-gameplay-flow).
- No new data models or state structure; polish is purely UI/UX.
- Copy-to-clipboard MUST use standard `navigator.clipboard` API (with fallback).
- All loading states and transitions MUST complete within 500ms of user action.

### Key Interactions

- **Loading state visibility**: Buttons disabled, text + spinner during async work
- **Error recovery**: Automatic retry with countdown; manual exit link after threshold
- **Role clarity**: Header badge + prompt text change based on player role
- **Copy feedback**: Toast or tooltip confirmation of successful copy
