# Phase 1: Internal API Contracts

## Endpoints

### 1. Start Game
**POST** `/api/rooms/:roomId/start`
- **Request Body**: None.
- **Headers**: Must include player identification (e.g., `X-Player-ID`) to verify the requester is the Host.
- **Response (200 OK)**: Success. Room transitions to `Game`. Backend assigns the drawer and generates `wordOptions`.

### 2. Select Secret Word
**POST** `/api/rooms/:roomId/word`
- **Request Body**: `{ "word": "apple" }`
- **Headers**: Must include player identification (`X-Player-ID`) to verify the requester is the assigned Drawer.
- **Response (200 OK)**: Success. Round transitions to `Drawing` phase and the timer starts.

### 3. Room State Payload Modifications (GET `/api/rooms/:roomId`)
The response structure for a room will conditionally include secret information based on the `X-Player-ID`.
- **Drawer View**: 
  ```json
  "currentRound": { 
    "drawerId": "player1", 
    "wordOptions": ["apple", "tree", "cat"], 
    "secretWord": null, 
    "roundStatus": "SelectingWord" 
  }
  ```
- **Guesser View**: 
  ```json
  "currentRound": { 
    "drawerId": "player1", 
    "roundStatus": "SelectingWord" 
  }
  ```
  *(Note the omission of `wordOptions` and `secretWord`)*
