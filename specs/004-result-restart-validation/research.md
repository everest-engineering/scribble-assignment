# Research: Result, Restart & Final Validation

## Key Decisions

### Round-End Triggers — Both Auto and Manual
- **Decision**: The round ends automatically when all non-drawer participants have guessed correctly, AND the drawer can manually end the round via an "End Round" button. The `endRound` endpoint is idempotent — if the room is already in "result" status, it returns success without error.
- **Rationale**: Auto-end provides a natural completion path. Manual end is a fallback for when guessers are stuck (no timer exists). Idempotency handles the race condition where both triggers fire simultaneously.
- **Alternatives considered**: Auto-end only (round never ends if a guesser can't guess it), manual-end only (drawer must always remember to end), timer-based (complexity — would need polling-based countdown or WebSockets).

### Score Persistence on Restart
- **Decision**: Scores are preserved when the host restarts the game. They are only cleared when a completely new game starts from the lobby (via the existing `startGame` which sets `scores = {}`).
- **Rationale**: Players can see their final scores in the result view even after returning to the lobby. The host can reset scores by clicking "Start Game" again. This matches the expectation that "restart" keeps the same game session.
- **Alternatives considered**: Reset scores on restart (players lose visibility of final results), carry scores into the next round automatically (would skip the lobby step).

### Result View — Inline on GamePage
- **Decision**: The `ResultView` component is rendered inline on the `GamePage` when `room.status === "result"`. No separate route is added.
- **Rationale**: Simpler routing, no redirect logic needed, and the existing room poll (2s) already detects status changes. The game page swaps canvas/guess UI for result content.
- **Alternatives considered**: Separate `/result` route (additional redirect, more state management).

### Race Condition Handling
- **Decision**: `endRound` is idempotent (returns success if already "result"). The auto-end check in `submitGuess` is safe because Node.js processes requests sequentially per event-loop tick — only one of `endRound` or `submitGuess` wins, and the loser handles it gracefully.
- **Rationale**: The idempotent `endRound` means the drawer never sees an error if the round ended naturally at the exact same moment. The `submitGuess` returning `roomStatus` lets the frontend update immediately.
- **Alternatives considered**: Database-level locking (overkill for in-memory), optimistic concurrency with version numbers (unnecessary complexity).

### Secret Word Visibility in Result State
- **Decision**: `getSecretWord` now returns the word for both `"playing"` and `"result"` statuses. `toRoomSnapshot` reveals the word to all participants when status is `"result"`.
- **Rationale**: The spec requires the word to be revealed to everyone in the result view. The original implementation only returned the word for `"playing"` status, which would have blocked this.
- **Alternatives considered**: Store the word separately on the Room for result state (redundant — the index-based lookup works fine).

## Gaps & Assumptions

### Gaps (deferred or out of scope)
- **No score animations**: The transition from gameplay to result is instantaneous. No celebration screen, confetti, or animated score tally.
- **No play-again shortcut**: After restart, players return to the lobby and the host must manually click "Start Game" again. No "Play Again" button that skips the lobby entirely.
- **No per-round score breakdown**: The result view shows cumulative scores only. Players cannot see how many points they earned in the just-completed round vs earlier rounds.
- **No disconnect handling during result**: If a player disconnects while the room is in "result" state, they cannot rejoin (join returns lobby status). No mechanism to re-sync disconnected players to the result view.
- **No drawer-gratification**: The drawer receives no bonus points or recognition for selecting/illustrating the word well.
- **No "correct word" animation or fanfare**: The revealed secret word is displayed as plain text with a yellow background. No confetti, no sound effects.
- **No final canvas display**: The result view does not show the final canvas drawing — only the word, scores, and guess history.

### Assumptions
- **Drawer and host are the same person**: The current implementation assigns the host as the drawer. The "End Round" button (shown to the drawer) and "Restart Game" button (shown to the host) would appear for different people if these roles diverged. The spec considers this acceptable for now.
- **Manual "End Round" is sufficient UX**: Without a timer, the drawer is responsible for ending the round when they feel guessers have had enough time. No visual cues (elapsed time indicator, suggestion to end) are provided.
- **Scores persist correctly on restart**: The `restartGame` function intentionally skips `room.scores = {}`. If a future change adds score reset logic, it must be coordinated with this assumption.
- **Lobby page shows "Ready to play" during result**: A player on the lobby page while the room is in "result" status will see "Ready to play" even though the room is actually in result state. This is a cosmetic edge case — players should be on the game page during gameplay.
- **Inline result view is safe**: Rendering `ResultView` directly in the `GamePage` component means the canvas and guess form DOM is fully unmounted. No memory leaks or stale event listeners from the game UI.
