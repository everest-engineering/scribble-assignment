# Discovery & Architecture Analysis

## Gaps

1. **Session Restoration & Reconnection Failures**: The starter code and subsequent features rely on in-memory React state linked to a volatile `participantId`. If a user refreshes their browser, they lose their session token and the backend throws a "Name is already taken" error if they try to rejoin.
2. **Unbounded Memory Growth in Drawing State**: The starter code's in-memory data store appends every single drawing coordinate action to the `Room.drawingState` array. Without a database or a snapshotting mechanism, this array grows indefinitely during a round, risking massive payload sizes and high memory consumption on the Node server.
3. **Lack of Secure Authorization**: The starter code relies exclusively on unverified client-provided `participantId` strings (passed in headers or bodies) to authorize actions. There are no signed session tokens (like JWTs), meaning any malicious actor could easily intercept or spoof a `participantId` to hijack host privileges or draw on the canvas.

## Assumptions

1. **Single-Instance Vertical Scaling**: We explicitly assume the environment will only ever run on a single Node.js process. Because the data store is an in-memory JavaScript `Map` provided by the starter code, deploying this behind a load balancer with multiple instances would result in split-brain state.
2. **Honest Client Gameplay**: We explicitly assume user behavior is honest and users will not attempt to cheat. The `secretWord` is exposed in the `RoomSnapshot` during the `result` state, and if a bug accidentally exposed it to a guesser, they could easily cheat. We assume standard cooperative gameplay behavior over implementing complex anti-cheat.
3. **Stable Network Polling Tolerance**: We explicitly assume the environment and client networks are stable enough to handle aggressive HTTP polling (e.g., 1 request per second) without hitting rate limits or suffering from major latency jitter.

## Relevant Files

- `backend/src/services/roomStore.ts`
- `backend/src/models/game.ts`
- `backend/src/api/rooms.ts`
- `backend/src/services/drawingService.ts`
- `backend/src/services/guessService.ts`
- `frontend/src/state/roomStore.ts`
- `frontend/src/pages/GamePage.tsx`
