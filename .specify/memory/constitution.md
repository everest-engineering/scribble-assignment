# Scribble Game Engineering Constitution

This constitution defines the long-term engineering principles and standards for the multiplayer Scribble drawing game. These principles constrain both backend and frontend development and MUST be followed for every feature implementation.

## 1. Code Quality & Maintainability
- **TypeScript First**: All code written for the backend and frontend MUST be fully typed. The use of `any` is strictly prohibited. If a type is truly dynamic, `unknown` MUST be used alongside appropriate type guards or assertions.
- **ES Modules**: Standard relative and absolute ES module imports MUST be used across both environments. File extensions MUST be omitted or handled via `.js` standards where required.
- **Immutability**: Developers SHOULD prefer immutable data structures. Pure functions MUST be used for calculations, state transformations, and game rule evaluations to avoid side effects.
- **React Patterns**: The frontend MUST use functional components and strict React hooks (`useState`, `useEffect`, etc.).
- **Code Style Consistency**: Code style MUST remain consistent with the existing patterns in the project. Linting and formatting rules SHOULD be run before committing changes.

## 2. Simplicity & Modular Design
- **Single Responsibility Principle**: Each module, function, and component MUST have a single, clear responsibility.
- **Backend Architecture & Structure**:
  - `src/api` MUST only handle routing, payload validation, and HTTP responses.
  - `src/services` MUST contain the core business logic (e.g., room lifecycle, gameplay rules).
  - `src/models` MUST define the data structures and TypeScript interfaces.
  - **Memory Management**: The backend MUST keep the memory footprint for active game rooms minimal and explicitly remove inactive rooms to avoid stateful bloat.
- **Frontend Architecture & Styling**:
  - Components SHOULD be presentational and visually clean.
  - Complex state management and logic MUST be encapsulated in custom hooks or state stores under `src/state` (following the established patterns in `roomStore.ts` using Zustand or Context API).
  - **Styling Rules**: Classes MUST reside in `app.css` or CSS modules. Components MUST be kept structurally clean.
- **No Over-Engineering**: Features MUST be implemented using the simplest viable logic. Premature optimizations or adding unnecessary abstraction layers SHOULD be avoided.

## 3. Performance & Responsiveness
- **Polling Efficiency**: Because WebSockets are not permitted, client-server sync MUST use HTTP polling.
  - The polling frequency MUST be balanced (e.g., ~2 seconds for lobby/gameplay history).
  - Backend endpoints serving polling requests MUST keep responses small and fast, avoiding heavy computations.
- **Frontend Render Optimization**: Components MUST use appropriate React hooks (`useMemo`, `useCallback`) to prevent unnecessary re-renders during active canvas updates or polling cycles.
- **Network Payload Minimization**: API responses SHOULD only return fields that are necessary for the current UI state.

## 4. Security & Server-Side Validation
- **Zero Trust Client**: The backend MUST NEVER trust input from the client. All gameplay state, validation of turns, drawer checks, and scoring calculations MUST be performed and stored on the server.
- **Request Validation**: All request payloads (body, parameters, query string) and responses MUST be validated on the backend using `Zod` schemas before any business logic executes.
- **Input Sanitization & Trimming**: Player names and guess inputs MUST be trimmed of leading/trailing whitespace. Whitespace-only or empty strings MUST be rejected with clear error messages.
- **Multi-room Isolation**: All room data MUST be strictly isolated. A client in Room A MUST NEVER be able to query or affect the state of Room B.

## 5. Error Handling & Recovery
- **Fail Fast and Gracefully**: Code SHOULD detect invalid state or conditions early.
- **Backend Recovery**:
  - Express routes MUST catch exceptions and forward them to a centralized error handler.
  - In-memory data store operations MUST fail gracefully without crashing the Node.js process.
- **Frontend Resilience**:
  - The frontend UI MUST NEVER crash due to API errors or unexpected server payloads.
  - Polling mechanisms MUST handle transient network failures gracefully, using exponential backoff or simple retries, and showing a fallback/reconnecting indicator to the user.
  - Errors from user actions (e.g. entering an invalid room code) MUST be displayed clearly as inline/toast UI messages.

## 6. Testing Expectations
- **Manual Verification**: Features MUST be verified manually using at least two independent browser sessions (tabs or windows) to simulate multiplayer flows.
- **State Transition Testing**: Transitions (e.g., Lobby -> Game -> Result -> Restart) MUST be tested for clean state teardown and setup.
- **Edge Cases**: Empty strings, special characters, case-insensitive guesses, and simultaneous request polling MUST be actively verified.

## 7. Documentation Standards
- **Self-Documenting Code**: Variable, function, and component names MUST be highly descriptive.
- **Inline Documentation**: Complex business logic, state transitions, or math/rendering logic on the canvas MUST be documented with clear inline comments.
- **API Spec Preservation**: Any changes or additions to REST endpoints MUST be documented in the corresponding specification file.

## 8. Accessibility & User Experience
- **Semantic HTML**: Frontend pages MUST use proper HTML5 semantic elements (`<main>`, `<section>`, `<nav>`, `<header>`).
- **Interactive States**: Buttons, links, inputs, and drawing tools MUST have clear hover, focus, and active visual states.
- **Error/Loading States**: Loading indicators MUST be displayed during api requests, and clear validation feedback MUST be rendered for user mistakes.

## 9. AI Collaboration Rules
- **Code Review**: All code generated by AI assistants MUST be reviewed line-by-line for readability, security, and conformity to this constitution before commitment.
- **Step-by-step Refactoring**: Large-scale refactoring SHOULD be broken into smaller, reviewable commits rather than single large edits.
- **Constraint Enforcement**: AI assistants MUST be explicitly instructed on constraints (e.g., no WebSockets, no database) prior to generation.

## 10. Boundaries & Out-of-Scope Technologies
The following technologies and practices are strictly out-of-scope. No code referring to or implementing these MUST be added:
- **No WebSockets**: Do not use Socket.io or native HTML5 WebSockets. Sync MUST be done via HTTP polling.
- **No Databases**: Do not use databases or persistent storage (SQL, MongoDB, Redis, SQLite). All data stores MUST be in-memory only.
- **No Authentication**: Do not use accounts, logins, JWT, OAuth, or sessions.
- **No Deployment/Infrastructure**: Do not configure CI/CD pipelines, Docker, or Kubernetes.
- **No State/Routing Libraries**: Do not introduce new state management or routing libraries beyond what is already present in the starter (React Router v6).
