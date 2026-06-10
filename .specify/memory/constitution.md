<!-- SYNC IMPACT REPORT
Version change: [TEMPLATE] → 1.0.0
Modified principles: All (initial fill — no prior version existed)
Added sections:
  - Core Principles (I–V)
  - Performance & Quality Standards
  - Development Workflow
  - Governance
Removed sections: N/A (initial ratification)
Templates requiring updates:
  - .specify/templates/plan-template.md ✅ — Constitution Check gates align with all five principles
  - .specify/templates/spec-template.md ✅ — Scope/requirements sections compatible; no changes needed
  - .specify/templates/tasks-template.md ✅ — Task categories cover accessibility, auth, and test-first phases
  - .specify/templates/commands/ ⚠️ — Directory not found; skipped
Follow-up TODOs: None — all placeholders resolved
-->

# Scribble Constitution

## Core Principles

### I. Component-Driven Architecture
The frontend MUST be built with Vite + React + TypeScript using composable, independently testable
components. No monolithic views; each component owns a single responsibility. The backend MUST use
Node.js + Express + TypeScript with a clear separation between route handlers, business logic, and
data access layers. Shared type definitions MUST live in a common package or types directory
consumed by both client and server.

### II. Type Safety (NON-NEGOTIABLE)
TypeScript strict mode (`"strict": true`) MUST be enabled on both client and server. No `any`
type annotations are permitted in production code. All API request/response shapes MUST be
expressed as shared TypeScript types; type drift between frontend and backend is a blocking defect.
Type-check errors MUST be resolved before a PR is merged.

### III. Test-First Development (NON-NEGOTIABLE)
Minimum **80% line and branch coverage** is a hard CI gate — PRs that fall below this threshold
MUST NOT merge. Tests MUST be written and confirmed failing before implementation begins
(Red-Green-Refactor). Unit, integration, and accessibility tests all count toward the 80% target.
No exceptions without explicit constitution amendment.

### IV. Accessibility (NON-NEGOTIABLE)
All UI MUST conform to **WCAG 2.1 AA**. Every interactive element MUST be keyboard-accessible and
screen-reader-compatible. Automated axe-core audits MUST pass in CI on every PR. A manual
keyboard-navigation review is REQUIRED before any feature is marked complete. Accessibility
failures are blocking defects, not cosmetic issues.

### V. Secure by Default
**Authentication is required** on all non-public routes — enforced by both client-side route guards
and server-side Express middleware. Credentials, API keys, and secrets MUST NOT appear in source
code or client bundles. All user-supplied input MUST be validated and sanitized server-side before
use. Security audit failures (npm audit high/critical) are blocking.

## Performance & Quality Standards

- Bundle size MUST remain at or below **~150 KB gzipped** (initial load). Exceeding this limit
  requires documented justification and a remediation plan in the PR before merge.
- Lighthouse CI performance score MUST remain ≥ 85 on each PR.
- `npm audit` MUST be run on each PR; high/critical severity vulnerabilities are blocking.
- Production builds MUST use tree-shaking and dynamic `import()` for non-critical code paths.
- No dead code or unused dependencies may be introduced; enforced via lint rules.

## Development Workflow

- All work MUST happen on feature branches; direct commits to `main` are prohibited.
- Every PR requires at minimum one peer review and a fully passing CI run (tests + lint +
  type-check + bundle budget check + axe audit).
- The Red-Green-Refactor cycle MUST be followed: write failing tests → implement → refactor.
- Deployments to production require all CI gates to pass; manual overrides are not permitted.
- Breaking API changes require a semver version bump and a migration note in the PR description.

## Governance

This Constitution supersedes all other development practices within this project. Amendments MUST
be proposed via PR, include a rationale section, and receive approval from at least one other
contributor before merging. `CONSTITUTION_VERSION` MUST be incremented following semantic versioning
on every amendment (MAJOR: principle removal/redefinition; MINOR: new principle/section; PATCH:
clarifications and wording fixes).

Compliance is reviewed on each PR via the Constitution Check gate in the implementation plan
template. All PRs MUST verify that the work does not violate any principle above. Complexity beyond
these principles MUST be explicitly justified in the Complexity Tracking section of the plan.

**Version**: 1.0.0 | **Ratified**: 2026-06-09 | **Last Amended**: 2026-06-09
