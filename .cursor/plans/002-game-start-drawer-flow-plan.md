# Implementation Plan: Game Start & Drawer Flow

**Branch**: `002-game-start-drawer-flow` | **Date**: 2026-05-30 | **Spec**: [spec.md](../specs/002-game-start-drawer-flow/spec.md)

**Input**: Feature specification from `/specs/002-game-start-drawer-flow/spec.md`

## Summary

Extend the Scenario 1 room flow so player names are trimmed and validated, game start assigns
the host as drawer with a deterministic secret word (`rocket`), and viewer-aware room snapshots
expose the word only to the drawer. Add game-screen polling (~2s) for role sync, and enrich the
game UI with drawer/guesser labels and conditional secret-word display. Work is brownfield:
extend `Room` round fields, `startRoom()` initialization, `toRoomSnapshot()` filtering, Zod
name schemas, and frontend create/join/game pages.

See full plan at `specs/002-game-start-drawer-flow/plan.md`.
