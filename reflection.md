# Scribble Lab - Reflection

## Overview

This project implements a multiplayer "Scribble" drawing game (Pictionary-style) with an Express backend and React frontend, both in TypeScript with ES Modules. The implementation was guided by Speckit workflow artifacts across 4 phases.

## Phase 1: Room Setup & Lobby
- Created room model with Zod validation, in-memory Map storage
- Implemented `POST /rooms` (create) and `POST /rooms/:code/join` with name validation
- Built lobby UI with auto-polling (2s), room code display, participant list
- Host-only "Start Game" button, disabled with <2 players

## Phase 2: Game Start & Drawer Flow
- `POST /rooms/:code/start` endpoint assigns drawer (first in sorted participants)
- Deterministic word selection (index from sorted word list)
- `currentWord` hidden from guessers, visible to drawer
- Game page renders DrawingCanvas for drawer, read-only canvas for guessers
- Navigation: lobby → game page on start

## Phase 3: Gameplay Interaction
- `POST /rooms/:code/guess` — case-insensitive, trimmed, drawer blocked
- Correct guess grants +100 points, sets `roundEnd` status
- `POST /rooms/:code/draw` — saves stroke JSON, 500ms debounced
- Interactive canvas (mouse/touch), clear button, read-only for guessers
- Dynamic Scoreboard and ResultPanel components

## Phase 4: Result, Restart & Final Validation
- `POST /rooms/:code/restart` — host-only, clears round state, preserves participants
- Restart button on roundEnd screen for host
- `Exit to Lobby` button for all participants
- Verified: all tests pass, both builds succeed, no forbidden tech detected

## Challenges & Lessons
- Polling-based sync required careful state management to avoid stale renders
- Canvas stroke serialization (JSON → string → parse) introduced complexity
- Deterministic game rules (no randomness) required index-based selection
- Speckit workflow helped maintain traceability across phases

## Final Pre-Evaluation Status
- All artifact checks pass (constitution, 4 spec folders)
- Forbidden technology scan: clean
- All build/test commands pass
