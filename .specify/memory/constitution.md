# Core Development Principles

- No WebSockets.
- Use HTTP short polling at a fixed interval of 2 seconds for synchronization.
- The game supports a single active round at a time per room.
- Player names and guess inputs must be trimmed of leading/trailing whitespace.
- All comparison logic for names and guesses is case-insensitive.
- Rooms are isolated in-memory by 4-character room code.
- The host is always the first participant created in a room.
- Room state is kept in backend memory only; frontend must poll `/api/rooms/:code` for updates.
- New games can be restarted by clearing game-specific state while preserving the connected player list.
- Deterministic behavior is required for secret-word selection and point awards.
