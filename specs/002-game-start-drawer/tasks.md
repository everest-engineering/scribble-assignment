# Tasks 002 — Game Start & Drawer Flow

1. Extend types for `playing` status and roles — depends on 001 complete
2. Implement `pickWord(code)` in roomStore — depends on (1)
3. Implement `startGame` with drawer = host — depends on (2)
4. Filter `secretWord` in `toRoomSnapshot` — depends on (3)
5. Update start API response and errors — depends on (3)
6. Lobby polling navigates to `/game` when status is `playing` — depends on (5)
7. GamePage header shows role and word for drawer — depends on (4)
8. Backend tests for word determinism and visibility — depends on (4)
