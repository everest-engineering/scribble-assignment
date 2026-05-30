# Discovery Notes: Scribble Feature Groups

**Created**: 2026-05-31

## Relevant Starter Files

- `backend/src/models/game.ts`
- `backend/src/services/roomStore.ts`
- `backend/src/api/rooms.ts`
- `backend/src/api/schemas.ts`
- `frontend/src/services/api.ts`
- `frontend/src/state/roomStore.ts`
- `frontend/src/pages/CreateRoomPage.tsx`
- `frontend/src/pages/JoinRoomPage.tsx`
- `frontend/src/pages/LobbyPage.tsx`
- `frontend/src/pages/GamePage.tsx`
- `frontend/src/components/GuessForm.tsx`
- `frontend/src/components/Scoreboard.tsx`
- `frontend/src/components/ResultPanel.tsx`
- `frontend/src/styles/app.css`

## Documented Gaps From Starter App

1. **Room setup and lobby gap**: The starter room flow did not track a host, enforce host-only start, enforce a two-player minimum, or automatically poll the lobby for participant changes.
2. **Game start and drawer gap**: The starter game page was a placeholder and did not assign a drawer, choose a secret word, or hide the word from guessers.
3. **Gameplay interaction gap**: The starter app did not provide an interactive drawing canvas, synced drawing state, validated guess submission, synced guess history, or scoring.
4. **Result and restart gap**: The starter app did not have a shared result state, final score display, correct-word reveal, or restart flow that preserved players while clearing round state.

## Documented Assumptions

1. **Polling assumption**: All shared state synchronization uses HTTP polling because WebSockets and other push protocols are explicitly out of scope.
2. **Storage assumption**: Rooms, participants, drawings, guesses, scores, and result state remain in memory only because databases and persistent storage are explicitly out of scope.
3. **Single-round assumption**: The game lifecycle is limited to one round per start because multiple rounds, drawer rotation, timers, and bonus scoring are explicitly out of scope.

## Resolution Summary

- Group 1 resolved lobby gaps with host tracking, trimmed name validation, clear join errors, room isolation, automatic polling, and host-only start.
- Group 2 resolved start/drawer gaps with deterministic drawer and word selection plus drawer-only word visibility.
- Group 3 resolved gameplay gaps with drawing, clear canvas, validated guesses, polling sync, and deterministic scoring.
- Group 4 resolved result/restart gaps with shared result state and host-only restart to a clean lobby.
