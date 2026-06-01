# research.md

## Decision: Use Vite env files for presets, with local overrides

- Decision: Adopt Vite's `.env`, `.env.development`, `.env.staging`, `.env.production` conventions for named presets. Allow developer local overrides via `.env.local` and `.env.development.local`.
- Rationale: Vite already supports these files and maps variables prefixed with `VITE_` into the client build, minimizing build-tooling work and matches repo's Vite-based frontend.
- Alternatives considered:
  - Runtime config endpoint (served by backend) — allows changing endpoints without rebuilding, but adds additional server code and complexity for this repo's scope.
  - Embedding config in HTML during CI — heavier and overkill for local dev and this feature's goals.

## Decision: Provide a small runtime bootstrap for single-key overrides in development

- Decision: Add a lightweight `public/config.json` lookup used only in development to allow single-key override without rebuild (reads when app boots in dev). For production builds, rely on Vite env values.
- Rationale: Satisfies the requirement for single-key overrides without forcing full rebuild workflow; remains non-invasive and optional.
- Alternatives considered:
  - Implementing a full-featured settings UI — out of scope for P1.

## Decision: Validation utility as a Node script in `frontend/scripts/validate-env.ts`

- Decision: Implement a small TypeScript script that validates presence of required `VITE_` variables and exits non-zero when missing. Add a vitest unit test for the validator to follow Test-First rule.
- Rationale: Lightweight, cross-platform, and easy to run during local setup. Matches requirement FR-003 and SC-002.

## Security & Secrets

- Decision: Document that secrets MUST NOT be committed and provide a sample `.env.example` containing non-secret defaults. Add gitignore entries for `.env.local` and similar files.

## Next Steps (Phase 1 inputs)

- Define required variables (e.g., `VITE_API_URL`, `VITE_FEATURE_TOGGLE_X`) — will enumerate in `data-model.md`.
- Create `quickstart.md` with onboarding steps to add `.env.local` and run validator.
- Add validator script and minimal tests in `frontend/scripts` and `frontend/tests`.
