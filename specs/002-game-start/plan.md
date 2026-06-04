# Implementation Plan: Game Start & Drawer Flow

## Summary

Implement game start logic, drawer assignment, and secret word visibility controls. This feature depends on US1 — a room must exist and have sufficient players before a game can begin.

## Data Flow

Start Game → Assign Host as Drawer → Select Secret Word → Show Word to Drawer Only

## Testing Approach

Verify:
- The host is automatically assigned as the drawer when the game starts
- The drawer is clearly identified in the game UI
- The secret word is visible to the drawer
- The secret word is hidden from guessers
- Empty and whitespace-only player names are rejected during room creation and joining
