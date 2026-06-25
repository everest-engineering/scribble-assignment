# Feature Specification: Gameplay Interaction (Scenario 3)

## Overview

During an active round, the drawer draws on an interactive canvas and can clear it. Guessers submit guesses. All state syncs via polling. Correct guesses score 100; incorrect score 0.

## User Stories

- **US-3.1** As the drawer, I can draw on the canvas and my strokes appear on my screen.
- **US-3.2** As a guesser, I see the drawer's strokes after the next poll.
- **US-3.3** As the drawer, I can clear the canvas for all players.
- **US-3.4** As a guesser, I submit guesses that appear in synced history.
- **US-3.5** As a guesser, a correct guess (case-insensitive) awards 100 points.

## Acceptance Criteria

### AC-3.1 Drawing
- **Given** the drawer draws on canvas, **When** strokes are POSTed, **Then** they are stored and returned in subsequent GET snapshots for all players.

### AC-3.2 Clear canvas
- **Given** the drawer clicks Clear, **When** clear is POSTed, **Then** strokes array is empty for all players on next poll.

### AC-3.3 Guess validation
- **Given** a guesser submits empty/whitespace guess, **When** submitted, **Then** 400 "Guess is required".
- **Given** a drawer tries to guess, **When** submitted, **Then** 403 "Drawer cannot guess".

### AC-3.4 Guess comparison
- **Given** secret word is "rocket", **When** guesser submits "Rocket", **Then** marked correct, +100 score.

### AC-3.5 Guess history sync
- **Given** a guess is submitted, **When** any player polls, **Then** guess appears in history with player name, text, and correct flag.

### AC-3.6 Game polling
- **Given** status is playing, **When** on game page, **Then** room polls every ~2s.

### AC-3.7 Round end
- **Given** a correct guess, **When** processed, **Then** status becomes `result`.

## Edge Cases

- Wrong guess adds 0 points but appears in history
- Multiple wrong guesses allowed until correct
- Non-drawer cannot POST strokes or clear

## Out of Scope

- Stroke smoothing libraries, undo, color picker, eraser modes
