<!--
  Sync Impact Report

  Version change: N/A (initial) → 1.0.0
  Modified principles: N/A (all new)
  Added sections:
    - Core Principles (I–V)
    - Technical Constraints
    - Development Workflow
    - Governance
  Removed sections: N/A

  Templates requiring updates:
    - .specify/templates/plan-template.md       ✅ No update needed (generic "Constitution Check" placeholder adapts per-feature)
    - .specify/templates/spec-template.md       ✅ No update needed (no constitution-specific references)
    - .specify/templates/tasks-template.md      ✅ No update needed (no constitution-specific references)
    - .specify/templates/checklist-template.md  ✅ No update needed (no constitution-specific references)
    - .specify/templates/commands/              ⚠ Does not exist — N/A

  Follow-up TODOs: None
-->

# Scribble Constitution

## Core Principles

### I. TypeScript Strictness
All code MUST be fully typed with TypeScript. The `any` type is FORBIDDEN; use `unknown` for genuinely dynamic values. All request payloads and responses MUST be validated with Zod schemas. Imports MUST follow ES module conventions. Strict mode MUST be enabled in tsconfig.

### II. Brownfield Enhancement — No Rewrites
This project is a brownfield enhancement. Existing code MUST NOT be rewritten from scratch. Changes MUST be additive and minimally invasive. Unjustified refactors are FORBIDDEN. New dependencies MUST be justified and MUST NOT duplicate capabilities already provided by the existing stack.

### III. HTTP Polling — No WebSockets
All client-server synchronisation MUST use HTTP polling. WebSockets, Socket.io, Server-Sent Events, and any real-time push protocol are STRICTLY FORBIDDEN. The frontend MUST poll at a cadence defined by the spec (default ~2s for lobby).

### IV. In-Memory State — No Database
All application state MUST be stored in-memory only. No SQL, NoSQL, SQLite, or any database system may be introduced. Server restart resets all state. Rooms with no participants MUST be cleaned up to minimise memory footprint.

### V. Incremental & Verifiable Delivery
Work MUST follow the specify → plan → tasks → implement → validate loop. Each implementation slice MUST be independently testable with acceptance criteria in Given/When/Then format. Commits MUST be granular and traceable to the spec. Builds MUST pass (`npm run build` in both backend and frontend) before any commit.

## Technical Constraints

### Technology Stack
- **Backend**: Node.js, Express, TypeScript (ES2022+), Zod, tsx.
- **Frontend**: React 18, React Router 6, Vite 5, TypeScript.
- **Testing**: Vitest for both backend and frontend.
- **State management**: React Context + useSyncExternalStore only (follow roomStore.ts pattern). No Zustand, Redux, or third-party state libs.
- **Routing**: react-router-dom v6 only.
- **CSS**: Classes in `app.css` or CSS modules. No CSS-in-JS libraries.

### Explicitly Out Of Scope
The following MUST NOT be implemented: multiple rounds, drawer rotation, timers, countdowns, speed bonuses, custom word packs, spectator mode, moderation features (kick/mute), room passwords, invite links, deployment/CI/Docker work, or rewriting existing starter code.

## Development Workflow

### Spec Kit Artifact Discipline
Maintain four artifacts: Constitution, Specification, Plan, and Tasks. All artifacts MUST be committed and internally consistent. The specification MUST list acceptance criteria in Given/When/Then format. Each artifact iteration MUST correspond to a meaningful increment in the implementation.

### Build Validation
Before every commit, both applications MUST build without errors:
```
cd backend && npm run build
cd frontend && npm run build
```

### Commit Discipline
Commits MUST be granular, meaningful, and traceable to the spec. A commit SHOULD represent one logical slice of work. Squashing unrelated changes into a single commit is FORBIDDEN.

### Review Gate
The `review-spec` and `review-plan` gates in the workflow MUST be respected. AI-generated output MUST be critically reviewed for correctness, completeness, and alignment with the constitution before being committed.

## Governance

The Constitution supersedes all other project guidance, including AGENTS.md and this file's earlier versions. Amendments require:

1. **Documentation**: The proposed change MUST be written up with rationale.
2. **Review**: The change MUST pass a review gate.
3. **Version bump**: The version MUST be bumped per semantic versioning rules (MAJOR for incompatible principle changes, MINOR for new principles, PATCH for clarifications).

All PRs and reviews MUST verify compliance with these principles. Any deviation MUST be documented and justified in the Complexity Tracking section of the plan.

**Version**: 1.0.0 | **Ratified**: 2026-06-08 | **Last Amended**: 2026-06-08
