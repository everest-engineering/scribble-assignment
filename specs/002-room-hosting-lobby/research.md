# Research: Room Hosting & Lobby

## Decision: Polling Interval

- Decision: Use a 2000ms (2s) fixed polling interval with optional small client-side jitter (±100–300ms).
- Rationale: Matches the spec requirement for ~2s visibility while avoiding synchronized thundering herd across clients.
- Alternatives: Server-Sent Events / WebSockets (rejected per constitution).

## Decision: Room Code Generation

- Decision: Generate a 6-character, case-insensitive alphanumeric code (A–Z, 0–9), excluding visually ambiguous characters if desired; generate with secure RNG (`crypto.randomBytes`) and check-store collision with retry (up to N attempts, e.g., 5).
- Rationale: 6 chars gives 36^6 ≈ 2.1B combinations, making collisions unlikely for our target scale; retry-on-collision is simple and deterministic for in-memory store.
- Alternatives: Longer code (7+ chars), or UUID-based short ids; we prefer short human-friendly codes.

## Decision: Room Cleanup Timeout

- Decision: Garbage-collect empty rooms after 5 minutes (300000 ms) of inactivity since `lastActiveAt`.
- Rationale: Balances developer convenience and memory usage; configurable via environment variable `ROOM_TTL_MS`.
- Alternatives: Shorter (1–2 minutes) or longer (30+ minutes) TTLs depending on usage; make configurable.

## Decision: Concurrency & Race Handling

- Decision: Keep operations in the `roomStore` synchronous and atomic in-process (no external locks). For start/join races, enforce server-side checks (e.g., `if room.state !== 'lobby' reject`) and return deterministic errors. For code generation collisions, regenerate and retry.
- Rationale: Simplicity for an in-memory single-process app; explicit checks avoid state corruption.

## Decision: Scaling Considerations

- Decision: Target baseline of 100 concurrent rooms in-memory; document limits and recommend moving to a shared store for higher scale.
- Rationale: In-memory is simpler for this phase; migration path documented in `quickstart.md`.

## Actions / To implement

- Implement polling client with 2s interval and jitter.
- Implement `createRoom`, `joinRoom`, `getRoom` and `startRoom` endpoints with validation.
- Implement `roomStore` methods: `createRoom`, `getRoom`, `joinRoom`, `startGame`, `cleanupInactiveRooms` (runs periodically).
- Add `ROOM_TTL_MS` env var and sensible default (300000).

## Sources / References

- In-repo constitution: HTTP Polling Only, In-Memory Data Only.
- Practical ops: crypto RNG + collision-retry patterns.
