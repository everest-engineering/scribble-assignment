# Implementation Plan: Game Start & Drawer Flow

**Branch**: `002-game-start` | **Spec**: [spec.md](./spec.md)

## Summary

This phase validates the game start mechanics. Research indicates that the core backend logic (`startRoom`, `selectSecretWord`, `toRoomSnapshot`) and frontend logic (`GamePage.tsx`) are already implemented. The primary focus of this plan is to verify the correctness of these implementations through rigorous automated testing and fine-tuning the UI experience.

## Technical Context

- Backend logic: `roomStore.ts`
- Frontend logic: `GamePage.tsx`, `roomStore.ts` (client)

## Planned Changes

1. **Testing**: Add dedicated API integration tests to strictly verify that guessers cannot access the secret word via API endpoints.
2. **Verification**: Ensure the frontend UI appropriately toggles visibility and controls based on the `isDrawer` state.
3. **Refinement**: Clean up any remaining placeholder text related to the game start phase in the UI.

## Risk and Scope

- **Security**: The biggest risk is leaking the secret word to guessers via the API response payload. Strict API-level tests are required.
- **Scope**: Limited to game start and drawer identification. Round progression and scoring are for subsequent phases.
