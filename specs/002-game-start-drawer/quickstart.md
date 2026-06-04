# Quickstart: Game Start & Drawer Flow

## Validation Scenarios

### Scenario 1: Input Validation
- Attempt to create a room with name `"   "`
- Expected outcome: HTTP 400 Bad Request, message: `"Username cannot be empty or only whitespace."`

### Scenario 2: Game Start & Roles
- Host starts the game from the lobby (at least 2 players present)
- Room status changes to `active`
- Host's snapshot displays the word `"rocket"`
- Guest's snapshot displays the masked word `"______"` (or `_ _ _ _ _ _`)
