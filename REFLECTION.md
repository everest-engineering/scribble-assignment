# Reflection Report

## What the starter app already had

The starter app provided the basic Scribble scaffold with a React frontend and an Express backend.
It included the main UI flow and pages for Start, Create Room, Join Room, Lobby, and Game.
The backend offered an in-memory room API (`POST /rooms`, `POST /rooms/:code/join`, `GET /rooms/:code`) and the frontend supported room creation, joining, and snapshot-based lobby loading.
The initial implementation also included seeded words and roles, basic routing, placeholder game UI, and manual lobby refresh behavior.

## What I added

I completed all four required scenarios using a Spec Kit-driven SDD workflow.
The implementation now includes:

- Host tracking for the room creator and host-only permissions for starting the game
- Validation for player names, join codes, and guess input, including trimmed and empty-value rejection
- Automatic lobby polling so room state refreshes regularly without manual user action
- Deterministic drawer assignment and secret word visibility only for the drawer
- Gameplay interaction with drawing controls, clear canvas, guess submission, and synced guess history via polling
- Case-insensitive guess matching, scoring of correct guesses, round result state, and automatic result transition on the first correct guess
- Shared result display and host-triggered restart that preserves players while clearing round state

I also kept the work aligned to the Spec Kit process by using discovery, specification, planning, and task artifacts to guide each feature incrementally.

## AI Assistance and Trade-offs
I used AI assistance primarily for structuring Spec Kit artifacts and validating the feature scope. The implementation was still verified manually and with targeted tests. I chose polling-based sync and a single-round `results` transition to stay within the assignment's no-WebSocket, no-persistence constraints while keeping the codebase small and deterministic.
