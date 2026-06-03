# Reflection

## What the starter already had

A runnable but intentionally incomplete Scribble scaffold:

- A React + TypeScript frontend (Vite, React Router v6) with Start, Create Room,
  Join Room, Lobby, and Game screens — but Lobby and Game were placeholders.
- An Express + TypeScript backend with an in-memory room store and four routes
  (`/health`, `POST /rooms`, `POST /rooms/:code/join`, `GET /rooms/:code`).
- A room model that only knew the `lobby` status: no host, drawer, word, guesses,
  scores, result, or restart.
- A planted bug: the frontend API base URL defaulted to `http://localhost:3001/bug`,
  so every request 404'd and Create/Join were broken in the browser.

## What I added

Worked the Spec Kit loop (specify → plan → tasks → implement → validate) once per
feature group, committing each artifact and each implementation slice separately.

- **Fix first:** corrected the API base URL so the starter actually runs.
- **Group 1 — Room & Lobby:** host tracking on creation, room-code validation with
  clear messages, ~2s lobby polling, and a host-only start gate (≥2 players).
- **Group 2 — Start & Drawer:** trimmed/required player names, a host-only
  start-game transition, deterministic word selection from the room code, drawer
  assignment, and server-enforced drawer-only word visibility.
- **Group 3 — Gameplay:** an interactive drawing canvas with clear, validated
  guesses (trim + case-insensitive), a synced guess history, and 100-point
  scoring — all kept in sync via ~2s polling.
- **Group 4 — Result & Restart:** a correct guess ends the round; the result
  (correct word, final scores, full history) is revealed to everyone; a host
  restart returns all players to the lobby with players preserved and round state
  cleared.

## Key decisions

- **Deterministic word selection** is a pure function of the room code, so every
  client agrees without coordination and the logic is unit-testable.
- **Drawing is local to the drawer.** The scenario only requires the drawing to be
  visible on the drawer's screen, so I did not stream pixels — polling syncs the
  shared facts (guesses, scores, word reveal). This stayed within scope and avoided
  heavy data transfer over HTTP polling.
- **Correct guess ends the round** (sets `ended`), which gives a clean, shared
  result state and a single, deterministic round-end trigger.
- **Word visibility is enforced server-side** in `toRoomSnapshot` (drawer during
  play; everyone once ended), never on the client, so the secret never leaks.

## AI usage and tradeoffs

I used AI to draft both the Spec Kit artifacts and the implementation, but reviewed
every change against the spec before committing and kept commits granular so the PR
diff stays traceable. The main tradeoff was scope discipline: it was tempting to add
rounds, rotation, or timers, but those are explicitly out of scope and would have
caused drift between the artifacts and the code. Restarting the backend clears all
rooms (in-memory only) — acceptable for this lab. Tests focus on the deterministic
backend logic (word selection, start/guess/restart rules, scoring, visibility);
canvas and polling were validated manually with two browser tabs.
