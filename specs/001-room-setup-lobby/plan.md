# Technical Plan: Room Setup and Lobby

## Overview
This feature extends the existing Scribble starter project by adding host tracking, automatic lobby polling, player validation, and start-game controls while preserving the current architecture and in-memory backend storage.

---

## Frontend Architecture

### Pages
- Create Room Page
- Join Room Page
- Lobby Page

### Components
- Participant List
- Lobby Header
- Start Game Button
- Error Message Display

### State Management
- React useState
- React useEffect for polling
- Existing starter architecture should remain unchanged

---

## Backend Architecture

### Existing Endpoints
- POST /rooms
- POST /rooms/:code/join
- GET /rooms/:code

### New Endpoints
- POST /rooms/:code/start

---

## Room State Model

### Room
```ts
{
  code: string;
  hostId: string;
  participants: Participant[];
  gameState: "lobby" | "playing" | "results";
}