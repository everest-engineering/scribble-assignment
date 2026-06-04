# Data Model: Round End and Restart

## Entities

### Room (Updated)
- **Status Transitions**:
  - `in-game` → `ended`: 
    - **Trigger (Manual)**: Host calls `/api/rooms/:code/end`.
    - **Trigger (Automatic)**: Every active guesser has a correct guess in `guessHistory`.
  - `ended` → `lobby`:
    - **Trigger (Manual)**: Host calls `/api/rooms/:code/restart`.

## State Clearing Rules (Restart)
When transitioning from `ended` to `lobby`:
- `status`: Set to `lobby`
- `currentWord`: Set to `null`
- `drawerId`: Set to `null`
- `canvasData`: Set to `null`
- `guessHistory`: Set to `[]`
- `scoreboard`: All player scores reset to `0` immediately.
- `participants`: **PRESERVED**.
- `hostId`: **PRESERVED**.

## Terminology
- **Active Guessers**: Defined as all participants in the room whose ID does not match the current `drawerId`.

## Edge Case Logic
- **Concurrency**: First request to update status on server wins.
- **Churn**: Player removal does not auto-end the round. Automatic checks occur only on `POST /guess`.
