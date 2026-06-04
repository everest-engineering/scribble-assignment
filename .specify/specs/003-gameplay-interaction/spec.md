# Feature Specification: Gameplay Interaction

**Feature Branch**: `assignment`

**Created**: 2026-06-04

**Status**: Draft

**Input**: Scribble assignment business scenarios

## User Story

As a player, I want drawing, guessing, and scoring so that I can participate in gameplay.

**Priority**: P3

**Why this priority**: This is the core game interaction.

**Independent Test**: Draw, submit guesses, verify synchronized history, and validate scoring.

## Acceptance Scenarios

1. **Given** a drawer interacts with the canvas, **When** drawing occurs, **Then** drawing data is stored and visible on the drawer screen.
2. **Given** a drawer clears the canvas, **When** the clear action completes, **Then** the canvas resets.
3. **Given** a guesser submits a guess, **When** the guess is valid, **Then** it appears in shared guess history.
4. **Given** a guess matches the secret word ignoring case, **When** the guess is processed, **Then** the player receives 100 points.
5. **Given** a guess does not match the secret word, **When** the guess is processed, **Then** the score remains unchanged.

## Functional Requirements

* FR-009: System MUST support drawing and canvas clearing.
* FR-010: System MUST support guess submission.
* FR-011: System MUST synchronize guess history through polling.
* FR-012: System MUST award 100 points for correct guesses.

## Success Criteria

* SC-003: Correct guesses consistently award 100 points.

## Edge Cases

* Empty guesses
* Whitespace-only guesses
