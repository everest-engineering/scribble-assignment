# Speckit Constitution

## Engineering Principles

1. **TypeScript First** — All code is fully typed. No `any`. Use `unknown` for truly dynamic types. Leverage Zod for runtime validation with inferred static types.

2. **Immutability** — Room state is cloned via `structuredClone` before returning to callers. Never mutate shared state outside the owning service.

3. **Fail Fast** — Validate all inputs at the API boundary with Zod schemas. Centralized error handler converts ZodErrors to 400 responses and known error types to appropriate status codes.

4. **Minimal Dependencies** — Only use what the starter ships: Express, Zod, React 18, React Router 6, Vite. No new top-level dependencies without spec justification.

5. **Deterministic Game Logic** — All game mechanics (word selection, scoring, drawer assignment) are deterministic. No randomness after room creation. Same inputs always produce same outputs.

## AI Usage Rules

1. **No out-of-scope features** — Never implement WebSockets, databases, authentication, deployment, Docker, spectator mode, room moderation, passwords, invite links, drawer rotation, timers, bonuses, or custom word packs.

2. **Extend, don't rewrite** — Never rewrite existing starter files from scratch. Add to existing patterns.

3. **No unrelated refactoring** — Only touch files needed for the current scenario. Avoid style-only changes or restructuring.

4. **No synthetic data** — Never add placeholder or seed data beyond what the starter provides.

5. **No surprise actions** — Ask before creating new files, changing project configuration, or modifying the commit history.

## Review Discipline

1. **Tests must pass** — Run `npm run test` in both backend and frontend after every change.

2. **Build must pass** — Run `npm run build` in both projects before marking a scenario complete.

3. **Two-browser validation** — After each scenario, verify acceptance criteria with two browser tabs playing simultaneously.

4. **Granular commits** — Commit file-by-file with meaningful messages starting with a capital letter. Each commit must be independently explainable.

5. **Spec alignment** — Every implementation change must trace back to an acceptance criterion in the spec. Deviations must be documented.
