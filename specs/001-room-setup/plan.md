# Scenario 1 Plan: Room Setup & Lobby

## Overview
This plan outlines the technical design and implementation steps required to support room creation, host identification, validation rules, lobby state restrictions, and automated HTTP polling for player updates.

## Proposed Changes

### Backend Components

#### [MODIFY] [backend/src/services/roomService.ts](file:///Users/naveenkumarb/Desktop/spec-kit/scribble-assignment/backend/src/services/roomService.ts)
- Modify the Room and Participant data structures to include `isHost` flag.
- Set the first participant creating the room to `isHost = true`.
- Set subsequent participants to `isHost = false`.

#### [MODIFY] [backend/src/api/rooms.ts](file:///Users/naveenkumarb/Desktop/spec-kit/scribble-assignment/backend/src/api/rooms.ts)
- Update input validation schemas for player name and room code to trim the inputs and check for minimum length (> 0).
- Throw clear user-facing errors if validation fails.

### Frontend Components

#### [MODIFY] [frontend/src/pages/Start.tsx](file:///Users/naveenkumarb/Desktop/spec-kit/scribble-assignment/frontend/src/pages/Start.tsx)
- Perform client-side `.trim()` on names and codes.
- Reject empty inputs with inline error messaging.

#### [MODIFY] [frontend/src/pages/Lobby.tsx](file:///Users/naveenkumarb/Desktop/spec-kit/scribble-assignment/frontend/src/pages/Lobby.tsx)
- Conditionally render the "Start Game" button only if the player is marked as host.
- Keep the button disabled if participant count is less than 2.
- Implement background HTTP polling calling `GET /rooms/:code` every 2000ms using a React `useEffect` hook with a clean-up interval.

---

## Verification Plan

### Automated Tests
- Run `npm test` on backend to verify room routes validation works.
- Run `npm test` on frontend to verify components render without crash.

### Manual Verification
- Launch backend and frontend.
- Open two browser tabs.
- Create a room on Tab A, verify "Start Game" button is visible but disabled.
- Join room on Tab B, verify Tab A's button becomes enabled automatically within 2 seconds.
