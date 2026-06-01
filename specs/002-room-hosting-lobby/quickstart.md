# Quickstart: Run the app locally (feature: Room Hosting & Lobby)

Prereqs: Node.js 18+, npm

From repo root:

```bash
# Run backend
cd backend
npm install
npm run dev

# In a separate terminal, run frontend
cd frontend
npm install
npm run dev
```

- Create a room via the frontend `Create Room` UI or by calling `POST /api/rooms`.
- Join using the `Join Room` UI with the returned code.

Env vars

- `ROOM_TTL_MS` — room time-to-live (ms) for empty/inactive rooms; default `300000` (5m).

Polling

- Lobby polling interval: clients poll `GET /rooms/:code` every ~2000ms with a small jitter (~±500ms) to reduce thundering-herd effects. This is the recommended default used by the frontend.

Testing

```bash
# from repo root
cd backend
npm test
cd ../frontend
npm test
```
