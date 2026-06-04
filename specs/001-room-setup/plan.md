# Implementation Plan: Room Setup & Lobby

## Summary

Implement room creation, joining, lobby synchronization, and host-only game start. This feature establishes the foundation for multiplayer gameplay.

## Technical Context

- TypeScript throughout
- React frontend with Vite
- Express backend
- In-memory room store
- HTTP polling for synchronization (~2 second interval)
- No authentication
- No database

## Constitution Check

The implementation must comply with:
- Polling only — no WebSockets or push technologies
- No authentication or session management
- No database — in-memory state only
- Brownfield enhancement — extend existing architecture rather than replacing it

## Data Flow

Create Room → Assign Host → Join Room → Poll Room State → Host Starts Game

## Testing Approach

Verify:
- Host assignment on room creation
- Room isolation between separate rooms
- Polling correctly propagates participant changes
- Host-only start enforcement
- Invalid room codes return appropriate errors
- Empty and whitespace-only player names are rejected
- Minimum two players guard prevents premature game start
