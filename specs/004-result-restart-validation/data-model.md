# Data Model: Result, Restart & Final Validation

## Entities

### Room (Updated Status)
- `status`: `"lobby" | "active" | "results"`

### RoomSnapshot (Updated)
- When `status === "results"`, `wordTemplate` MUST display the actual `currentWord` (unmasked) to all participants.
