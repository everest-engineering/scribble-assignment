# Implementation Plan: Gameplay Interaction

## Summary

Implement drawing canvas interaction, guess submission, scoring, and synchronized history. This is the core gameplay loop where players draw and guess.

## Data Flow

Drawer Draws → Save Drawing State → Drawer Clears Canvas → Reset Drawing

Guesser Submits Guess → Validate Guess → Update Score → Update Guess History

## Testing Approach

Verify:
- Drawing data is persisted when the drawer interacts with the canvas
- Canvas resets when the drawer clears it
- Guesses appear in shared guess history for all players
- Case-insensitive guess matching awards 100 points for the correct word
- Incorrect guesses leave the score unchanged at 0 points
