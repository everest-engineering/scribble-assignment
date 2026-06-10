-> Unable to create room - Getting `Route not found` error
After checking the code its making the request to http://localhost:3001/bug/rooms which is why we are getting above error.

-> Join room also showing `Route not found` error when trying to join a room that doesn't exist. Its also making request to similar bug endpoint. http://localhost:3001/bug/rooms/ASDF/join

-> Root cause: API base URL has /bug instead of /api.
