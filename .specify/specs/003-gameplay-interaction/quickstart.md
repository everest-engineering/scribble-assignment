# Quickstart: Gameplay Interaction

## Overview
This feature adds real-time drawing, guessing, and scoring mechanics.

## Setup
1. Ensure room is created and game started (via 001/002 specs).
2. Use the new API endpoints to interact with drawing and guessing.

## API Interaction
- Draw: `POST /api/rooms/:roomId/canvas`
- Guess: `POST /api/rooms/:roomId/guess`
- Sync state: Poll `GET /api/rooms/:roomId/state`
