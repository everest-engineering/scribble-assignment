# Quickstart: Room Setup & Lobby

## Development
1. Start Backend: `cd backend && npm run dev`
2. Start Frontend: `cd frontend && npm run dev`

## Verification
1. **Host Flow**: Create a room, verify "Host" tag in lobby.
2. **Join Flow**: Open second window, join with code, verify automatic refresh (US3).
3. **Capacity**: Join with 8 players, verify 9th player is rejected with clear message.
4. **Game Start**: Verify host can start only when >= 2 players; verify non-host cannot start.

## Tests
- `npm run test` in both directories.
