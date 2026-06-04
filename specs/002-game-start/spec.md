# Feature Specification: Game Start & Drawer Flow

## User Story

As a player, I want a clearly identified drawer and secret word so that gameplay begins consistently.

**Priority**: P2

**Why this priority**: A round cannot begin without role assignment and word selection.

**Independent Test**: Start a game and verify drawer assignment and drawer-only word visibility.

## Acceptance Scenarios

1. **Given** a game starts, **When** the first round begins, **Then** the host becomes the drawer.
2. **Given** a drawer is assigned, **When** the game screen loads, **Then** the drawer is clearly identified.
3. **Given** a secret word is selected, **When** a drawer views the game, **Then** the word is visible only to the drawer.
4. **Given** a guesser views the game, **When** the round is active, **Then** the secret word is hidden.

## Functional Requirements

* FR-006: System MUST assign the host as drawer.
* FR-007: System MUST select a deterministic secret word.
* FR-008: System MUST hide the secret word from guessers.
