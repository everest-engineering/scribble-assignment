# Tasks: Game Start & Drawer Flow

## Dependencies

- 001-room-lobby (hostId, start endpoint skeleton)

## Ordered Tasks

1. [ ] Extend RoomStatus and Participant.score in models
2. [ ] Add name trim/reject validation in schemas and roomStore
3. [ ] Implement deterministic word selection in roomStore
4. [ ] Update startGame to set playing status, drawerId, secretWord, reset scores
5. [ ] Implement viewer-specific secretWord in toRoomSnapshot
6. [ ] Update frontend types for playing status, drawerId, secretWord
7. [ ] Add client-side name validation on create/join pages
8. [ ] Update GamePage: drawer label, secret word panel (drawer only)
9. [ ] Add lobby auto-navigate to /game when status is playing
10. [ ] Add backend tests for name validation and word visibility
11. [ ] Validate drawer/guesser views in two tabs
