# Constitution — Scribble Lab

## Engineering Principles
1. **TypeScript First**: All code must be fully typed. Avoid `any`; use `unknown` for dynamic types.
2. **Immutability**: Prefer immutable data patterns. Use `structuredClone` for room state copies.
3. **Fail Fast**: Validate inputs at the boundary. Return clear error messages.
4. **No Stateful Bloat**: Clean up inactive game state explicitly. Keep memory footprint minimal.
5. **Deterministic Game Rules**: Word selection must be deterministic from the starter list. Scoring must be predictably 100 for correct, 0 for incorrect.

## AI Usage Rules
1. **Review Before Commit**: Every AI-generated change must be reviewed before staging.
2. **One Scenario Per Commit**: Each business scenario must be implemented and committed independently.
3. **Traceability**: Every commit message must reference the scenario being implemented.
4. **No Spec Drift**: Code behavior must match the spec. Deviations must be documented.

## Review Discipline
1. **Build Validation**: Run `npm run build` in both backend and frontend before each commit.
2. **Test Existing Tests**: Run `npm test` to ensure no regressions.
3. **Two-Browser Test**: Validate multi-player flows with two browser tabs.
4. **Granular Commits**: Keep commits small and focused on a single concern.
