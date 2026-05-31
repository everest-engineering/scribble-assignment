# Reflection Report

## What did the starter app already have?

The starter application already supported:

* Room creation
* Room joining via room code
* Lobby screen with participant list
* Basic routing between pages
* In-memory backend room storage
* Manual room refresh functionality

The game screen, drawing functionality, scoring, and game flow were scaffolded but not implemented.

## What did you add?

For Scenario 1 (Room Setup & Lobby), I added:

* Host tracking during room creation
* Player name validation
* Room code validation
* Case-insensitive room lookup
* Automatic lobby polling every 2 seconds
* Host-only start game functionality
* Minimum player count validation before starting
* Error handling and user feedback for invalid inputs

## How did I use Spec Kit?

I followed the Spec Kit workflow:

1. Discovery and codebase inspection
2. Constitution creation
3. Specification creation
4. Technical planning
5. Task generation
6. Incremental implementation
7. Validation against acceptance criteria

The specification served as the source of truth throughout implementation.

## Validation Performed

I verified:

* Room creation assigns host correctly
* Invalid names are rejected
* Players can join using valid room codes
* Invalid room codes display errors
* Room codes are case-insensitive
* Lobby updates automatically through polling
* Only hosts can start games
* Games require at least two players before starting

## Tradeoffs and Decisions

* Used polling instead of WebSockets because the assignment explicitly scoped real-time communication out of scope.
* Preserved the existing starter architecture instead of introducing major refactors.
* Focused on meeting acceptance criteria before additional enhancements.

## Lessons Learned

This lab helped me understand how to work in a brownfield codebase, create specifications before implementation, and maintain alignment between requirements, plans, tasks, and code changes.
