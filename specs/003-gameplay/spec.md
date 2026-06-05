# Feature Specification: Gameplay & Guessing

**Feature Branch**: `003-gameplay`

**Created**: 2026-06-05

**Status**: Draft

## Objective

Implement the active round experience: the drawer sees a secret word and a canvas, guessers submit text guesses, and all players share a synchronized guess history.

## Acceptance Criteria

1. Given a game round has started, when a player is the drawer, then they see the secret word and the drawing tools.
2. Given a guesser submits a guess, when the guess is empty or whitespace-only, then it is rejected with clear feedback.
3. Given a guesser submits a guess that matches the secret word ignoring case and surrounding whitespace, then it is marked correct.
4. Given a guess is recorded, when the state refreshes, then all players see the same guess history.
5. Given a correct guess, when it is accepted, then the guesser is awarded 100 points.

## Edge Cases

- The drawer should not see other players' guesses before they are submitted.
- Whitespace-only guesses are rejected without modifying room state.
- Guess matching must ignore case and surrounding whitespace.
- Drawing controls are only available to the drawer.

## Key Requirements

- Secret word visibility must be conditional on the drawer role.
- Guess submission must be validated and synchronized.
- Scoring must be deterministic for correct vs incorrect guesses.
