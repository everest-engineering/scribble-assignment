# Implementation Plan: Game Start & Drawer Flow

**Branch**: `scribble-lab` | **Date**: 2026-06-04

## Summary
Assign drawer role, select secret word, and gate word visibility by role.

## State Model Changes

### Backend — Room
- Add `drawerId: string`
- Add `secretWord: string`
- Add `round: number` (default 1)

### RoomSnapshot
- Add `drawerId: string` (always visible)
- Add `secretWord?: string` (only if viewer is drawer)
- Add `round: number`

## File-Level Changes

### Backend
1. `backend/src/models/game.ts` — Add drawerId, secretWord, round to Room
2. `backend/src/services/roomStore.ts` — Assign drawer=host in startGame, select word=STARTER_WORDS[0], set status=playing; update toRoomSnapshot to gate secretWord by viewerParticipantId === drawerId

### Frontend
3. `frontend/src/services/api.ts` — Update RoomSnapshot type with drawerId, secretWord?, round
4. `frontend/src/pages/GamePage.tsx` — Show secret word if viewer is drawer, show role indicator

## Implementation Sequence
1. Update Room model with new fields
2. Update startGame logic + toRoomSnapshot gating
3. Update frontend types
4. Update GamePage UI

## Data Flow
Host clicks Start → POST /rooms/:code/start → backend sets drawerId=hostId, secretWord=STARTER_WORDS[0], status=playing → toRoomSnapshot returns word only when viewer matches drawerId → frontend polls and renders conditionally
