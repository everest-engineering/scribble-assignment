# Discovery Notes

## Existing Working Features
- Create room works successfully
- Join room works successfully
- Multiple browser tabs can join the same room
- Lobby participant list renders correctly
- Manual refresh updates room participants
- Backend uses in-memory room storage

## Missing Features
- No automatic polling
- No host tracking
- No start game flow
- No drawer assignment
- No secret word visibility
- No interactive drawing canvas
- No guess handling
- No scoring system
- No results screen
- No restart flow

## Bugs Found During Discovery
- Frontend API base URL incorrectly pointed to `http://localhost:3001/bug`
- This caused room API requests to fail with 404 errors
- Fixed API base URL to `http://localhost:3001`

## Assumptions
- First player who creates the room becomes host
- Polling every 2 seconds is acceptable
- In-memory data resets after backend restart

## Relevant Files
- backend/src/server.ts
- frontend/src/services/api.ts
- frontend/src/pages
- frontend/src/components