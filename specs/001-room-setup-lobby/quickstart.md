# Quickstart: Room Setup and Lobby

## Setup
1. Start backend: `cd backend && npm run dev`
2. Start frontend: `cd frontend && npm run dev`

## Verification Flow
1. Open `http://localhost:5173` in **Tab A**.
2. Click "Create Room", enter name "Alice", and create.
3. Observe Alice is host (Start button visible).
4. Open `http://localhost:5173` in **Tab B**.
5. Click "Join Room", enter the code from Tab A and name "Bob".
6. Observe Tab A updates automatically within 2 seconds to show Bob.
7. Observe Tab B does NOT see a "Start Game" button (or it's disabled).
8. In Tab A, click "Start Game".
9. Both tabs should navigate to `/game` within 2 seconds.
