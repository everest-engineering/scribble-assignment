# Reflection Report: Scribble Lab

### 1. What the starter app already had:
It possessed a foundational UI shell, routing configurations, and basic room creation/joining capabilities that allowed players to enter a static lobby.

### 2. What was added:
* Automated HTTP short-polling (2s) to synchronize game states across distributed browser windows without manual refreshes.
* State validation routines ensuring strict host authorization mapping, trimmed username enforcement, and isolated multi-room handling.
* Core single-round gameplay loop involving deterministic drawer role selection, case-insensitive guess matching, point allocation, and a clean lobby reset routine.