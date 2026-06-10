# Quickstart: Gameplay Interaction

## Prerequisites

- Backend running: `cd backend && npm run dev` (port 3001)
- Frontend running: `cd frontend && npm run dev` (port 5173)
- Two browser tabs at `http://localhost:5173`
- Feature Groups 1 & 2 fully implemented (room setup, lobby, game start, drawer flow)

## Scenario A — Drawer draws and clears the canvas

**Tab 1 (Alice / Drawer)**
1. Create Room, name `Alice`. Note the room code.
2. In **Tab 2 (Bob / Guesser)**: Join Room, name `Bob`, enter Alice's code.
3. Back in **Tab 1**: Alice clicks Start. Both tabs navigate to the game screen.
4. In **Tab 1 (Alice / drawer)**: draw on the canvas using the mouse or pointer.
5. Verify the drawing is visible on Alice's screen.
6. Click the **Clear** button.
7. Verify the canvas is blank.

---

## Scenario B — Guesser submits an empty guess (rejected)

**Tab 2 (Bob / Guesser)**
1. In the "Your Guess" card, leave the input blank and click **Submit Guess**.
2. Verify the guess is rejected with a validation message (e.g., "Guess cannot be empty.").
3. Verify no guess appears in the guess history.

---

## Scenario C — Correct guess awards 100 points

**Tab 2 (Bob / Guesser)**
1. In the "Your Guess" card, type `ROCKET` (uppercase) and click **Submit Guess**.
2. Verify Bob's score in the scoreboard increases from 0 to 100.
3. Verify the guess "ROCKET" appears in the guess history marked as correct.

**Verify sync (Tab 1 — Alice / Drawer)**
4. Wait ≤ 3 seconds for the next poll.
5. Verify "ROCKET" appears in Alice's guess history as well.

---

## Scenario D — Incorrect guess awards 0 points

**Tab 2 (Bob / Guesser)**
1. Submit `pizza` as a guess.
2. Verify Bob's score does not change.
3. Verify the guess "pizza" appears in the guess history marked as incorrect.

---

## Scenario E — Case-insensitive matching

**Tab 2 (Bob / Guesser)**
1. Submit `rocket` (lowercase). Verify it is accepted as correct.
2. Submit `Rocket` (mixed case) in a fresh game. Verify it is also accepted as correct.

---

## Automated tests

```bash
cd backend && npm test
cd frontend && npm test
```

Key tests to add:
- `submitGuess rejects empty and whitespace-only inputs`
- `submitGuess awards 100 points for case-insensitive match`
- `submitGuess awards 0 points for incorrect guesses`
- `toRoomSnapshot includes scores and guesses for all viewers`
- `GuessForm validates client-side before submitting`
- `Scoreboard renders scores from room snapshot`
- `ResultPanel renders guess history from room snapshot`
