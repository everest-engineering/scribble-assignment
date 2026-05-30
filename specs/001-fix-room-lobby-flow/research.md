# Research: Fix Room Lobby Flow

## Decisions

- **Validation approach**: Client-side inline validation before form submission.
  Reasonable default for this feature scope — backend already validates via Zod.
- **Loading state pattern**: Reuse the existing `withLoading()` helper from
  `RoomStore` rather than adding a separate loading mechanism.

## Rationale

No unknown technical decisions were identified during the Technical Context
scan. All technology choices (TypeScript, React, Express, Zod, Vite) are
pre-determined by the project starter. The fix involves only frontend files:
- Primary bug: `frontend/src/services/api.ts:22` — remove `/bug` from default
  `API_BASE_URL`.
- Form validation: add guard clauses in `CreateRoomPage.tsx` and
  `JoinRoomPage.tsx` `handleSubmit` before calling store methods.
- Loading state: wrap `fetchRoom()` body with `withLoading()`.

## Alternatives Considered

- **Backend URL prefix**: Considered adding a `/api` prefix to the backend for
  correctness, but that would change the existing backend route structure.
  Decided to match the backend's actual route layout (no prefix) instead.
- **Runtime validation library**: Considered using a form library (React Hook
  Form) but decided against it per the constitution's dependency policy — no
  new top-level dependencies without justification.
