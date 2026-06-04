# Tasks: Game Start & Drawer Flow

This document outlines the tasks for implementing the game transition and role assignment logic.

## Backend Implementation
- [x] **Model Update**: Add `playing` to `RoomStatus` and update `Room` and `RoomSnapshot` interfaces.
- [x] **Service Logic**: Implement `startGame` in `roomStore.ts` with host validation and role/word assignment.
- [x] **Security Enforcement**: Update `toRoomSnapshot` to filter the `secretWord` based on the viewer's role.
- [x] **API Route**: Add the `POST /rooms/:code/start` endpoint to handle the start game trigger.

## Frontend Implementation
- [x] **API Integration**: Update the `api` service to include the `startGame` method.
- [x] **Redirection Logic**: Implement status-based redirection in `LobbyPage.tsx` using the polling loop.
- [x] **Role UI**: Update `GamePage.tsx` to use the `isDrawer` flag for rendering role-specific headers and info.
- [x] **Word Display**: Ensure only the drawer sees the secret word on the game screen.

## Validation Tasks
- [x] **Unit Testing**: Add and run tests in `roomStore.scenario2.test.ts` for role assignment and security rules.
- [x] **End-to-End Test**: Verify the full transition from lobby to game with two players in separate browser tabs.
- [x] **Build Check**: Confirm that all changes pass the TypeScript compiler and Vite build process.
