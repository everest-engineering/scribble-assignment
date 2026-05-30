# Scribble Lab — Reflection Report

## What the starter app already had

The starter was a **runnable brownfield scaffold**, not a finished game. It gave us a solid shell to extend rather than replace.

**Infrastructure**

- Monorepo with `frontend/` (Vite, React 18, TypeScript, React Router) and `backend/` (Node.js, Express, TypeScript, Zod).
- In-memory room storage (`Map<string, Room>`) with no database, auth, or WebSockets.
- Minimal REST API: `GET /health`, `POST /rooms`, `POST /rooms/:code/join`, `GET /rooms/:code`.
- Starter seed data: five words (`rocket`, `pizza`, `castle`, `guitar`, `sunflower`) and two roles (`drawer`, `guesser`).

**Frontend**

- App shell, routing, and branded pages: Start, Create Room, Join Room, Lobby, and Game.
- Presentational UI for canvas, guess input, scoreboard, and results — mostly placeholders.
- A `roomStore` pattern and API client wired to the backend.
- Light styling in `app.css`.

**Backend**

- Room create/join and snapshot fetch.
- Basic room model with participants; status was effectively lobby-only for real behavior.

**What it deliberately did *not* have**

- Host permissions, automatic polling, start-game flow, drawer assignment, word hiding, drawing, guesses, scoring, result state, or restart — as documented in the README “Not implemented yet” section.

---

## What we added later

Work was delivered **incrementally across four Spec Kit scenarios**, each with `spec.md`, `plan.md`, and `tasks.md` under `specs/`.

| Scenario | Focus | Main additions |
|----------|--------|----------------|
| **1 — Room setup & lobby** | Multi-player lobby | Host on create; join validation and room isolation; ~2s lobby polling; host-only start when ≥2 players |
| **2 — Game start & drawer** | Round begins | Trimmed name validation; `playing` status; host as drawer; deterministic word pick; drawer-only `secretWord` in snapshots |
| **3 — Gameplay** | Active round | Stroke/clear APIs and canvas; guess submission; case-insensitive scoring (+100 correct / +0 wrong); synced history via game polling |
| **4 — Result & restart** | Close the loop | `results` status on first correct guess; word revealed to all; `/result` page + polling; host-only `POST /restart`; navigation sync across `/lobby`, `/game`, `/result` |

**Cross-cutting additions**

- Vitest on backend (and light API tests on frontend).
- Zod schemas for mutating routes.
- Spec Kit artifacts: constitution, per-feature specs/plans/tasks, checklists, and `.specify/feature.json` tracking the active feature.

The final game supports a full loop: **create/join → lobby (poll) → start → draw & guess (poll) → results (poll) → host restart → lobby → play again**, using only HTTP polling.

---

## Tradeoffs

We made deliberate choices to stay inside lab scope. Each choice bought simplicity or traceability at the cost of production-grade multiplayer behavior.

### Architecture & sync

| Decision | Why we chose it | What we gave up |
|----------|-----------------|-----------------|
| **HTTP polling (~2s)** | Constitution and README require polling only; starter already pointed this way | Near-instant sync; lower server load; simpler client mental model |
| **In-memory rooms** | Required; no DB in scope | Persistence across backend restarts; multi-instance deployment |
| **No WebSockets / SSE** | Non-negotiable lab boundary | Efficient bidirectional updates; industry-standard live games pattern |
| **No auth or accounts** | Out of scope | Secure identity, kick/ban, cross-session history |

### Process & codebase

| Decision | Why we chose it | What we gave up |
|----------|-----------------|-----------------|
| **Brownfield extension** | README: do not rewrite the starter | Freedom to pick ideal folder names, state library, or routing from scratch |
| **Spec Kit artifacts per scenario** | Lab learning objective; traceability for review | Faster “just code it” iteration for a small app |
| **Vitest unit tests, not E2E** | Constitution favors deterministic service tests; no new E2E framework | Automated proof of full two-browser flows in CI |

---

## AI Usage

AI was the primary authoring assistant for both **artifacts** and **code**, but humans (and automated tests) owned **acceptance** and **merge decisions**.

### Tools and workflow

| Tool / practice | How we used it |
|-----------------|----------------|
| **Cursor (agent chat)** | Implemented features from `tasks.md`; read existing files before editing; ran Vitest and builds to verify output |
| **Spec Kit skills** | `/speckit-specify`, `/speckit-plan`, `/speckit-tasks`, `/speckit-implement`, checklists, and optional analyze/clarify steps per scenario |
| **Constitution** (`.specify/memory/constitution.md`) | Constrained AI suggestions: no WebSockets, DB, auth; ~2s polling; Zod on backend; minimal diffs |
| **`AGENTS.md`** | Repo-level coding conventions the agent followed (folder layout, TypeScript, forbidden deps) |
| **Feature specs** (`specs/00N-*/`) | Source of truth for *what* to build; AI plans and code were checked against FR-xxx and user stories |

Typical loop per scenario:

1. **Specify** — AI drafted or updated `spec.md` from README scenario text and clarifications.
2. **Plan** — AI produced `plan.md` with file paths, state transitions, and API behavior.
3. **Tasks** — AI generated ordered `tasks.md` with checkpoints and parallel markers `[P]`.
4. **Implement** — `/speckit-implement` drove backend-first slices, then frontend, then polish tasks.
5. **Validate** — Human ran two browser tabs; agent ran `npm test` and `npm run build`.

---

## Summary

The starter gave us **structure and UI placeholders**; we added **game rules, polling sync, and a complete round lifecycle** in four documented increments. **Tradeoffs** favored simple REST + in-memory state over real-time and persistence. **AI usage** followed Spec Kit end-to-end, with the constitution and two-tab validation as guardrails—not substitutes—for “done.”
