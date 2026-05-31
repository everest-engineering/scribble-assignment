# Reflection

## Project Overview

This project implements a browser-based multiplayer drawing-and-guessing game (Scribble-style) across four incremental feature specs. The full game loop goes: room creation → lobby → game start with drawer assignment → live drawing/guessing round → result reveal → restart. The stack is React 18 + Vite on the frontend and Express 4 + TypeScript on the backend, communicating over REST with no WebSockets or persistent database.

## Architecture Decisions

The most deliberate constraint was **REST polling over WebSockets**. Rather than push-based updates, clients poll every two seconds for room state. This kept the server stateless-per-request and eliminated the complexity of connection lifecycle management, reconnection logic, and socket namespacing. The tradeoff is a small latency band (up to 2 s lag for state propagation), which is acceptable for a turn-based game where near-real-time is not required.

State is held in an **in-memory `Map<string, Room>`** in the backend's `roomStore.ts`. This avoids a database dependency entirely, which makes local development and testing trivially simple. The obvious downside is that a server restart clears all rooms — a non-issue for an assignment scope but a hard limitation for production.

## Feature-by-Feature Summary

**Spec 001 — Room Setup & Lobby**: Room creation with host designation, join-by-code flow, and a lobby screen showing connected players. Introduced the core `Room` and `Player` types and the room store abstraction.

**Spec 002 — Game Start & Drawer Flow**: Host-triggered game start, deterministic word selection from a starter list, and role-aware display (drawer sees the secret word; guessers do not). Input validation rejects blank/whitespace-only names with an inline error.

**Spec 003 — Gameplay Interaction**: Interactive canvas for the drawer with clear support; stroke sync via polling so guessers see the drawing. Guess submission with case-insensitive comparison, whitespace trimming, and empty-guess rejection. Correct guesses award 100 points; incorrect guesses score nothing.

**Spec 004 — Result, Restart & Validation**: `"finished"` room status added as an additive extension to the existing status union. Host-only "End Round" button transitions the room; all players see the revealed word, final scores, and full guess history. Host-only "Restart" resets round state while preserving the player list, returning everyone to the lobby.

## Design Tradeoffs

Keeping the state machine simple (three statuses: `lobby`, `in-progress`, `finished`) made every transition easy to reason about and test. Role-based access (host-only actions) is enforced on the backend by checking the `playerId` against `room.hostId`, not just in the UI — so a determined user cannot bypass the restriction by calling the API directly.

Canvas sync was implemented server-side by storing strokes in the room snapshot and returning them on every poll response. This is bandwidth-heavier than a delta-based approach but straightforward to implement and debug.

## What I Would Improve

With more time I would replace polling with Server-Sent Events for lower latency without the full complexity of WebSockets. I would also add a round timer (auto-end after N seconds) and support for multiple rounds with rotating drawers. On the testing side, integration tests that exercise the full API surface end-to-end — rather than unit-testing each layer in isolation — would give higher confidence during refactors.
