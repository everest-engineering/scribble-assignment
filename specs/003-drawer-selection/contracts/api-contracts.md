# API Contracts: Drawer Selection & Secret Word

## Endpoints

### Create Room

- `POST /api/rooms`
- Request: `{ displayName: string }` (host's display name)
- Response: `{ roomId: string, clientId: string, room: Room }`

### Join Room

- `POST /api/rooms/:roomId/join`
- Request: `{ displayName: string, clientId?: string }`
- Response: `{ clientId: string, room: Room }` or `400 { code: 'invalid_name', message: 'Please enter a name.' }`

### Start Round

- `POST /api/rooms/:roomId/rounds/start`
- Request headers or body must include `clientId` to verify host/permission
- Response: `200 { roundIndex: number, drawerPlayerId: string }` (no secret word in this public response)

### Get Secret Word (drawer-only)

- `GET /api/rooms/:roomId/rounds/:roundIndex/secret`
- Request: must include `clientId` (e.g., header `x-client-id: <id>`)
- Success (drawer): `200 { secretWord: string }`
- Non-drawer: `403 { code: 'forbidden', message: 'Not authorized to view secret word.' }`

## Notes

- All endpoints must validate `displayName` by trimming and rejecting empty values.
- The server MUST NOT include `secretWord` in the room DTO returned to non-drawers.
