## Performance & Pagination Guidelines (NFR-001)

Purpose

- Keep guess-history memory and network usage bounded as rooms can generate many guesses over time.

Server-side recommendations

- Cap in-memory history per room to a reasonable maximum (e.g., 2000 events). Evict oldest events when exceeding the cap.
- Support pagination on `GET /rooms/:code/guesses` with query parameters:
  - `limit` (int, default 50, max 200)
  - `offset` (int, default 0)
  - Optionally support cursor-based paging using `after` with a timestamp/ID for more efficient incremental fetches.
- Provide an `X-Total-Count` response header when helpful for UI pagination controls.
- For very active rooms, provide summary endpoints (e.g., `GET /rooms/:code/guesses/recent?since=<iso>`) to support lightweight polling.

Client-side recommendations

- Default to `limit=50` and `offset=0` for initial loads. Use incremental fetching for older history.
- For polling, prefer fetching only new entries since last known `createdAt` or use `after`-cursor instead of re-fetching the entire page.
- Implement UI virtualization for rendering long history lists (e.g., windowing via React Virtualized) if the list grows large.

Example: server paginated response

Request:

```
GET /rooms/ABCD/guesses?limit=50&offset=0
```

Response (200): headers include `X-Total-Count: 1234`

```json
{
  "guesses": [
    {
      "id": "g1",
      "participantId": "p1",
      "text": "hello",
      "correct": false,
      "createdAt": "2026-06-01T00:00:00Z"
    }
  ]
}
```

Notes on tests

- Add unit tests for pagination bounds (limit/max), and integration tests that assert eviction behaviour when cap exceeded.
