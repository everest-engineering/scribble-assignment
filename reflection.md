# Reflection

This implementation extended the starter Scribble project in four focused feature groups rather than replacing the app structure. The backend remains an Express and TypeScript in-memory service, and the frontend remains a React, React Router, and Vite app using the existing local room store pattern.

The main design choice was to keep room state as the single shared snapshot returned by HTTP endpoints. Lobby membership, host capability, drawer identity, secret word visibility, drawing state, guess history, scores, result state, and restart state all flow through the same room snapshot shape. That made polling sufficient for synchronization and avoided adding real-time infrastructure or persistence.

The game rules were kept deterministic for lab review: the creator becomes host, the first participant becomes drawer, the starter word is selected from the fixed starter list, correct guesses score 100, and restart clears round-specific state while preserving the room code, host, and participant order. The secret word is only exposed to the drawer during play; after the result state, the correct word is exposed to all players; after restart, prior word and guess history are removed from snapshots.

Testing focused on behavior that could regress the multiplayer flow: invalid room codes and names, host-only start and restart, two-player minimum, room isolation, drawer-only drawing, empty and case-insensitive guesses, final result visibility, and lobby reset after restart. Backend service tests cover the core rules, frontend API tests cover request wiring, and builds verify TypeScript compatibility across both apps.

AI assistance was used to draft and iterate the specification, plans, tasks, implementation, and verification notes. The generated work was checked against the starter constraints, the repository structure, and automated tests. The final scope intentionally excludes WebSockets, databases, authentication, deployment work, Docker, new routing or state libraries, multiple rounds, drawer rotation, timers, bonuses, custom word packs, spectators, moderation, passwords, and invite links.
