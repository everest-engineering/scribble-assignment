<!--
Sync Impact Report
Version: 1.0.0 → 1.0.0
Modified principles: Initial Constitution
Added sections: Multiplayer Synchronization, Brownfield Enhancement
Removed sections: None
Templates requiring updates: None
Follow-up TODOs: None
-->

# Scribble Constitution

## Core Principles

### I. Brownfield Enhancement First

* The starter application is the source of truth.
* Existing architecture should be extended before introducing new patterns.
* Unnecessary refactoring is discouraged.
* Enhancements must remain aligned with the provided business scenarios.

### II. Deterministic Game Rules

* Game behaviour must remain deterministic and predictable.
* Drawer assignment must follow documented rules.
* Word selection must use the provided word list.
* Correct guesses award 100 points.
* Incorrect guesses award 0 points.
* Hidden information must only be visible to authorized participants.

### III. Input Validation

* User inputs must be validated before processing.
* Empty player names are rejected.
* Empty guesses are rejected.
* Invalid room codes are rejected.
* Validation errors must return clear user-facing messages.

### IV. Simplicity Over Complexity

* Solutions should favour clarity over abstraction.
* In-memory state remains the system of record.
* No unnecessary frameworks or architectural layers may be introduced.
* Features outside assignment scope should not be implemented.

### V. User Experience

* Error states must be understandable.
* Multiplayer synchronization should feel responsive.
* Important actions should provide visible feedback.
* Existing user flows must continue to function after enhancements.

## Multiplayer Synchronization Requirements

* Synchronization must use HTTP polling.
* Polling should occur approximately every two seconds.
* Room state must remain isolated between rooms.
* Multiplayer updates must propagate through polling rather than push technologies.

## Technical Constraints

The following are explicitly prohibited:

* WebSockets
* Socket.IO
* Authentication systems
* Authorization systems
* Databases
* Multiple rounds
* Drawer rotation
* Timers
* Custom word packs

## Development Workflow

* Discovery must precede implementation.
* Specifications must be completed before coding.
* Plans must align with approved specifications.
* Tasks must map back to planned work.
* Commits should remain granular and meaningful.

## Governance

This Constitution is the highest authority for project decisions. Specifications, plans, tasks, and implementation work must comply with these principles. Changes to the Constitution require documented rationale and review.

Version: 1.0.0 | Ratified: 2026-06-04 | Last Amended: 2026-06-04
