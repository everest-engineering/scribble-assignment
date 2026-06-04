# Research: Game Start & Drawer Flow

## Deterministic Word Selection
The secret word for each round is selected deterministically from the starter list (`backend/src/seed/starterData.ts`).
Algorithm: `starterList[roomId.length % starterList.length]`

## Secret Word Visibility
Backend will filter `currentWord` from the room state API response for all participants who are not the current drawer, ensuring secret word security.
