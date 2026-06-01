# Developer Quickstart: Result & Restart

**Branch**: `004-result-restart` | **Date**: 2026-05-31

## Feature Overview

This feature handles the end of a round (both timer-based and guess-based), showing the final result screen with the target word, player scores, and the final drawing canvas. It also implements the host's ability to cleanly reset the room back to the lobby state, fully wiping previous round data and resetting scores to 0.

## Implementation Steps

### Backend

1. **Room State & Transition Logic**: Update the core Room object/service in `backend/src/services/roomStore.ts` (or equivalent) to track the `results` phase. Add logic to automatically transition from `playing` to `results` when the timer finishes or all guessers guess the word correctly.
2. **Host Disconnect Handling**: Update the player disconnect logic to automatically reassign the host to the next active player (`players[0]`) if the current host leaves.
3. **Reset Endpoint**: Implement the `POST /api/rooms/:roomId/reset` endpoint in `backend/src/api/` and validate using Zod. It should verify the requester is the host, and then reset the room to `lobby` (clearing `targetWord`, `canvasState`, and resetting `scores`).

### Frontend

1. **Result Screen Component**: Create a `ResultScreen.tsx` (or similar) component that renders conditionally when the room's phase is `results`.
2. **Display Data**: In the result screen, render the `targetWord`, iterate over the `players` array to display their `scores` (maybe sorted by highest score), and render the `canvasState` using the existing canvas drawing component logic but disabled/read-only.
3. **Host Reset Button**: Display a "Return to Lobby" button strictly for the host on the result screen, which calls the new reset endpoint.

## Manual Testing Guide

1. Start the backend and frontend (`npm run dev` in both folders).
2. Open two browser windows and join the same room. Start the game.
3. Have the guesser guess the word correctly to instantly trigger the end of the round.
4. Verify both windows immediately show the result screen.
5. Verify the word, points, and a snapshot of the drawing are visible.
6. As the host, click "Return to Lobby".
7. Verify both players are instantly placed back in the lobby, and all scores are reset to 0.
8. (Edge Case) During the results screen, close the host's browser window. Verify the other player becomes the host and sees the "Return to Lobby" button.
