# Feature Specification: Result, Restart & Final Validation

## Description
When the round ends, all players (drawer and guessers) see the correct answer, the final scoreboard with all participant scores, and the complete guess history. The host can then restart the game, returning all players to the lobby with the participant list preserved but all round state (guesses, canvas, scores) cleared. This enables multiple rounds without losing the room.

---

## User Stories

### US-19 Result Screen Display
As any participant,
I want to see the result screen after the round ends,
so that I know the final answer and how everyone performed.

### US-20 Shared Correct Answer
As any participant,
I want to see the correct answer revealed on the result screen,
so that I can verify my guess or learn the answer.

### US-21 Final Scoreboard
As any participant,
I want to see the final scores of all participants,
so that I know who won the round.

### US-22 Complete Guess History
As any participant,
I want to see the complete list of all guesses made during the round,
so that I can review the game progression.

### US-23 Host Restart Trigger
As the host,
I want to restart the game after seeing results,
so that the next round can begin.

### US-24 Clean Round Reset
As the system,
I want to reset round state (guesses, canvas, scores, roles),
so that the next round starts fresh.

### US-25 Preserved Participant List
As a participant,
I want the room participant list to be preserved across restarts,
so that I can play multiple rounds with the same group.

### US-26 Lobby After Restart
As any participant,
I want to be returned to the lobby after a restart,
so that the host can start the next round.

---

## Acceptance Criteria

### AC-27
Result screen is displayed when the round ends.

### AC-28
The correct answer is visible to all participants on the result screen.

### AC-29
The final scoreboard displays all participants and their scores.

### AC-30
The complete guess history is displayed on the result screen.

### AC-31
Only the host can see and use the restart button.

### AC-32
Restart clears guesses array.

### AC-33
Restart clears canvas (canvasLines array).

### AC-34
Restart resets all participant scores to 0.

### AC-35
Restart reassigns roles (drawer, guesser) based on new order (first becomes drawer).

### AC-36
Restart resets room status from "playing" to "lobby".

### AC-37
Participant list is preserved across restart.

### AC-38
After restart, all participants are returned to the lobby page.

### AC-39
Round number increments on restart (round 1 → 2).

---

## Edge Cases

### EC-16
If no guesses were made during the round, the history should display "No guesses made".

### EC-17
If drawer never drew anything, canvas should show empty/blank.

### EC-18
Multiple correct guesses should all show in history as correct.

### EC-19
Rapid restarts should not cause race conditions or data loss.

### EC-20
Non-host attempting to trigger restart should be blocked.

### EC-21
Participant who was drawer in round 1 could be guesser in round 2 (based on order).

---

## Data Requirements

### Result Screen State
- Displays final answer (currentWord)
- Displays all participants with final scores
- Displays complete guesses array
- Displays canvas (canvasLines)

### Room After Restart
```ts
{
  status: "lobby",
  round: 2,
  guesses: [],
  canvasLines: [],
  participants: [ /* preserved */ ].map(p => ({ ...p, score: 0, role: undefined })),
  currentDrawerId: undefined,
  currentWord: undefined,
}
```

---

## Non-Goals
- Leaderboard persistence across sessions
- Automatic game end conditions (e.g., all correct or time limit)
- Custom restart options (e.g., shuffle players, change word)
- Multiple simultaneous rounds
