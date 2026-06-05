# Implementation Plan: Results & Restart

**Branch**: `004-results-restart` | **Date**: 2026-06-05 | **Spec**: [spec.md](./spec.md)

## Summary

Implement the shared result lifecycle and restart flow. The backend will transition a room to a result state when a round completes, and provide a host-only restart endpoint. The frontend will show the shared result panel and allow only the host to restart.

## Technical Context

- Backend: extend room lifecycle handling in `backend/src/services/roomStore.ts`, add `POST /rooms/:code/restart`.
- Frontend: add result rendering in `frontend/src/components/ResultPanel.tsx` and host-only restart control in `frontend/src/pages/GamePage.tsx`.
- Existing polling remains the synchronization mechanism.

## Approach

- Define `result` room status in models.
- Ensure restart preserves participants and resets round state/score.
- Guard restart to the room host.

## Validation

- Manual test with multiple tabs showing identical result state.
- Confirm restart brings all players back to the lobby with a cleared round.
