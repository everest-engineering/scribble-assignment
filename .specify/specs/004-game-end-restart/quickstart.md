# Quickstart: Round End and Restart

## Implementation Order

### 1. Backend: State, Endpoints & Edge Cases
- **Service**: Update `roomStore.ts` to reveal word on 'ended' status. Add `endGame` and `restartGame` (with full state reset).
- **Controller**: Add `/end` and `/restart`.
- **Automatic logic**: Update `/guess` handler to check if all active guessers are correct.
- **Edge cases**: Implement "First to Server" transition logic (guard status changes).

### 2. Frontend: API & Error Handling
- **Service**: Add `endGame` and `restartGame` to `api.ts`.
- **UI Store**: Add toast notification logic for host action failures.

### 3. Frontend: "End Round" Button
- **Page**: `GamePage.tsx`.
- **Action**: Render "End Round" button inside `.button-row` beside "Exit Game" (Host only, `status === 'in-game'`). Style as `button--secondary`.

### 4. Frontend: Results Modal
- **Component**: Create `RoundEndedModal.tsx`.
- **Layout**: Vertical stack:
  - Header: "Round Ended" title.
  - Word: Revealed word (bold).
  - Scores: Final scoreboard (max-height: 200px, scroll).
  - Activity: Guess history (max-height: 200px, scroll).
  - Footer: "Restart Game" (Host) or "Waiting for host..." (Guessers).
- **Styling**: Strict visual parity with existing `panel` and `card` styles.

### 5. Frontend: Auto-Navigation
- **Page**: `GamePage.tsx`.
- **Effect**: Monitor room status polling. If status becomes `lobby`, auto-navigate to `/lobby`.

## Verification
- Host ends round manually -> Modal appears, Toast appears on server error.
- All active players guess correctly -> Modal appears automatically.
- Host restarts -> All players auto-navigated to lobby with 0 scores.
- Churn test: Players leave mid-round, verify host can still end.
