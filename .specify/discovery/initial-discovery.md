# Initial Discovery Notes

## Purpose
The purpose of this discovery phase is to understand the existing starter application, identify missing functionality, and document assumptions before beginning specification and implementation work.

---

# Existing Working Features

The starter application currently supports:

- Room creation using a generated room code
- Joining a room using an existing room code
- Navigation between landing, room, lobby, and game screens
- Lobby participant display
- In-memory backend room storage
- Manual room refresh functionality
- Starter Scribble branding and UI styling

---

# Missing Behaviors / Gaps

The following required behaviors are currently missing or incomplete:

1. No host tracking exists for created rooms
2. No automatic lobby polling or synchronization exists
3. No validation for empty or whitespace-only player names
4. No start-game endpoint or game transition flow exists
5. No drawer assignment logic exists
6. No secret word assignment or visibility control exists
7. Canvas is currently a placeholder and not interactive
8. Guess submission logic is not implemented
9. Score tracking and result state are missing
10. Restart flow back to lobby does not exist

---
