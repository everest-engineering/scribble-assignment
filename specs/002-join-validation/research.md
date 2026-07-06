# Research: Join Validation

## Unknowns Resolved

| Unknown | Decision | Rationale |
|---------|----------|-----------|
| Where to validate empty codes? | Both client-side and server-side | Client-side for instant feedback (SC-001: <100ms); server-side for defense-in-depth (FR-005) |
| Error message format? | Exact string: "Invalid room code. Please try again with correct one." | Confirmed via clarification session; same message for empty, whitespace, and non-existent codes |
| HTTP status for each error case? | 400 for empty/whitespace, 404 for non-existent | 400 = bad request (invalid input format); 404 = resource not found; both return same message |
| How to handle Zod validation errors? | Convert ZodError to HttpError in catch block | Existing errorHandler middleware converts HttpError to JSON with message field; frontend `request()` function parses JSON error body |
| Data model changes? | None | Room code validation is purely a route/schema concern — no new fields on Room or Participant |

## Architecture Choices

- **Client-side validation**: Simple `if (!roomCode.trim())` check before API call — no new dependencies, matches existing pattern
- **Server-side schema validation**: Added `.trim().min(1)` to `roomCodeParamsSchema.code` — leverages existing Zod infrastructure
- **Error propagation**: ZodError caught in route handler → converted to HttpError → errorHandler middleware returns JSON → frontend request() throws Error with message from response body → caught in JoinRoomPage handleSubmit
- **Case-insensitive matching**: Already handled by `code.toUpperCase()` in both client (input field onChange) and server (route handler before calling joinRoom) — unchanged

## Alternatives Considered

| Alternative | Rejected Because |
|-------------|-----------------|
| Server-side only validation | Cannot meet SC-001 (<100ms client-side feedback) |
| Frontend-only validation | Violates FR-005 (defense-in-depth principle) |
| Custom error messages per error type (e.g., "Room not found" vs "Code required") | Would leak information about which room codes exist; spec requires generic message |
