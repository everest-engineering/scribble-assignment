<!--
Sync Impact Report
Version change: none → 1.0.0
Modified principles: initial draft
Added sections: Technology Constraints, Development Workflow
Removed sections: none
Templates requiring updates: ✅ .specify/templates/plan-template.md (checked, no update needed), ✅ .specify/templates/spec-template.md (checked, no update needed), ✅ .specify/templates/tasks-template.md (checked, no update needed)
Follow-up TODOs: none
-->

# Scribble Constitution

## Core Principles

### I. Human-led AI Assistance
AI is a support tool, not a decision maker. Generated code, docs, and task breakdowns must be reviewed, corrected, and accepted by a human before they enter the repository.

### II. Incremental, Scenario-Driven Progress
Development proceeds in small, validated slices aligned to the lab business scenarios. Every change must map to a testable acceptance criterion and preserve the ability to verify behavior independently.

### III. Testable Contracts First
New behavior must be defined by explicit contracts, validated schema, and measurable acceptance criteria before implementation. All backend inputs and outputs must be validated; frontend state must be strongly typed and error-safe.

### IV. Minimal In-Memory Backend
The backend is strictly in-memory and ephemeral. No database, no persistent storage, no external stateful services, and no authentication mechanisms are permitted in this project.

### V. HTTP Polling Only
All multiplayer synchronization is accomplished through periodic HTTP polling. Do not introduce WebSockets, Socket.io, or any push-based realtime transport.

## Technology Constraints

- Backend: Node.js, Express, TypeScript, Zod, tsx. In-memory room state only.
- Frontend: React 18, React Router v6, Vite, TypeScript. Use the existing room state model and avoid adding new global state libraries.
- No WebSockets, no Socket.io, no database, no authentication, no sessions, no external persistence.
- Game rules and round state must remain deterministic and visible through the REST API and polling cycle.
- Keep implementation scope aligned with the README business scenarios and lab checkpoints.

## Development Workflow

- Maintain Spec Kit artifacts for every feature: constitution, spec, plan, tasks, and research where applicable.
- Keep commits small and meaningful. Each commit should deliver one validated behavior or address one specific artifact.
- Every PR must reference the constitution and the relevant user scenarios from README.
- Validate new work through explicit tests, manual verification across two browser sessions, or both, as appropriate for the feature.
- Changes that conflict with these principles require an amendment to this constitution and a clear rationale in the PR description.

## Governance

This constitution governs engineering decisions for the Scribble assignment. It takes precedence over ad hoc implementation choices within this repository.

- Amendments require a documented PR with a clear rationale and updated Spec Kit artifacts.
- Version increments follow semantic rules:
  - MAJOR for incompatible governance or principle changes.
  - MINOR for new mandatory principles, workflow additions, or constraint expansions.
  - PATCH for wording clarifications, typos, and non-semantic refinements.
- Compliance review must confirm that generated code, documentation, and tests follow these principles before merge.

**Version**: 1.0.0 | **Ratified**: 2026-06-12 | **Last Amended**: 2026-06-12
