# Requirements Quality Checklist: Game Start & Drawer Flow

**Purpose**: Validate the Scenario 2 spec before implementation.
**Created**: 2026-06-05
**Feature**: [spec.md](./spec.md)

## Requirement Completeness

- [ ] CHK001 Name validation covered on both client (FR-001) and backend (FR-002).
- [ ] CHK002 Status extension, start endpoint, drawer assignment, deterministic
      word, and drawer-only visibility each have a requirement (FR-003…FR-008).
- [ ] CHK003 Lobby→game auto-navigation on `playing` is specified (FR-009).
- [ ] CHK004 Drawer-only word visibility is explicit: snapshot OMITS `word` for
      guessers (FR-007).

## Clarity & Consistency

- [ ] CHK005 Deterministic word formula is stated precisely and excludes
      `Math.random()` (constitution III).
- [ ] CHK006 "host or first player" is resolved to `hostId` (no ambiguity).
- [ ] CHK007 Terms `drawerId`, `wordIndex`, `status: "playing"` match the planned
      model names.

## Scope & Boundaries

- [ ] CHK008 No drawer rotation, multiple rounds, or timers introduced.
- [ ] CHK009 Word stays from `STARTER_WORDS` only (no custom/random packs).

## Testability

- [ ] CHK010 Deterministic order, drawer-only word, and start guards are
      unit-testable.
- [ ] CHK011 Two-tab flow verifies host-start propagation within ~2s.

## Notes

- Check items off as completed: `[x]`.
