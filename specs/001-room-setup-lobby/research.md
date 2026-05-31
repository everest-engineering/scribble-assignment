# Research: Room Setup & Lobby

## Key Decisions

| Decision | Choice | Rationale | Alternatives Considered |
|----------|--------|-----------|------------------------|
| Host tracking | `hostId` field on Room | Simplest approach; single field identifies the creator | `isHost` flag on each Participant (redundant data) |
| Room code alphabet | 20 chars: `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` | Avoids ambiguous 0/O, 1/I/L; matches existing implementation | Hex (too few combos), full alphanum (ambiguous chars) |
| Code case-insensitivity | Uppercase on input | Store all codes uppercase; normalize on create and join | Case-sensitive comparison (worse UX) |
| Polling mechanism | `setInterval` in LobbyPage | Simple, no external deps; auto-cleanup on unmount | `useEffect` with recursive `setTimeout` (more complex) |
| Polling interval | ~2 seconds | Balances responsiveness with server load | 1s (too aggressive), 3s (too slow) |
| Start game auth | Validate `participantId` matches `hostId` on server | Server-enforced; client can't bypass | Client-side only (insecure) |
| Game start transition | Navigate all participants via polling: room status → "playing" triggers redirect | No push needed; clients detect status change on next poll | SSE/WebSocket push (forbidden) |
| Name validation | Backend Zod schema validation | Consistent with existing pattern; returns clear error messages | Frontend-only (bypassable) |
| Join-in-progress guard | Check room status on join; reject if not "lobby" | Simple status check | Complex state machine |
