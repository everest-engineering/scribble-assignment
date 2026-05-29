# Scenario 3 Discovery: Gameplay Interaction

## Gaps (Incomplete Behaviors)

- The backend does not store drawing state, guess history, or participant scores.
- There is no drawing API or permission enforcement for the drawer.
- There is no clear-canvas action available.
- The guess form does not submit guesses to the backend or validate input.
- Guess history and scoreboard are placeholders with no synced data.
- There is no backend scoring logic for correct/incorrect guesses.

## Assumptions

- Drawing data can be stored as serializable path or stroke data.
- Guess text should be trimmed, normalized, and compared case-insensitively.
- Correct guesses score 100 points once per participant per round.
- History and score updates should sync through polling, not WebSockets.
