# Reflection Report

## Introduction
This reflection report covers the implementation, challenges, decisions, and outcomes throughout the Scribble multiplayer drawing game development lifecycle.

## What was already present
The starter repository provided:
- Basic routing and landing pages (Vite + React frontend).
- Scaffolded Express backend with basic room storage (in-memory).
- Placeholders for components like the Canvas, Scoreboard, and Results.

## What was added
Across the four implemented scenarios, we added:
1. **Room Setup & Lobby**: Host identification on room creation, automatic polling of lobby participants (~2s cadence), name validation (trimming and rejecting empty names), and host-only start game control with a 2-player minimum requirement.
2. **Game Start & Drawer Flow**: Clean drawer assignment logic, deterministic word selection from the starter list, and drawer-only secret word visibility.
3. **Gameplay Interaction**: Interactive painting canvas, clear-canvas capability, guess validation (trimming, case-insensitivity, empty checks), guess history log sync via polling, and correct-guess scoring (+100 points).
4. **Results & Restart Flow**: Automatic transition to the `RESULTS` state when all guessers have successfully guessed the secret word, plaintext word reveal to all players, final sorted scoreboard, host-restricted "Restart Game" option, and round state clearance (resetting scores to 0, clearing strokes and guess history) with automatic redirect to the Lobby.

## Verification & Testing
- Automated backend unit tests pass (`npm test` in `backend`).
- All manual multi-player flow validations have been performed.
- Spec Kit checklists and task tracking have been updated to reflect full completion.
