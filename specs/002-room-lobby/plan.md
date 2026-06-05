# Implementation Plan: Room & Lobby Sync

**Branch**: `002-room-lobby` | **Date**: 2026-06-05 | **Spec**: [spec.md](./spec.md)

## Summary

Add first-class room and lobby behavior to the existing backend and frontend. This includes host assignment on room creation, validated join-by-code, room isolation, and periodic polling to synchronize lobby participant lists.

## Technical Context

- Backend: in-memory room store, Express, TypeScript.
- Frontend: React, `roomStore.ts`, periodic polling via `setInterval`.
- No new dependencies.

## Approach

- Extend backend room state to encode `hostId` and stable room codes.
- Enforce join validation for empty or invalid codes.
- Keep room state isolated in a `Map<string, Room>`.
- Use client-side polling (~2s) for lobby updates.

## Validation

- Manual two-tab test for create/join synchronization.
- Confirm invalid join codes fail clearly.

## Dependencies

- Reuse existing backend `backend/src/services/roomStore.ts` and frontend `frontend/src/state/roomStore.ts`.
- No cross-feature dependencies beyond baseline application routing and API endpoints.
