# Project Reflection: Scribble Implementation

## 1. What did the starter app already have?

As documented in the initial discovery phase, the starter application provided a functional structural scaffold with the following features already operational:

- **Room Management**: Basic creation of rooms with generated 4-character codes and the ability to join existing rooms.
- **Navigation**: A complete routing structure (`react-router-dom`) allowing navigation between the Start, Create, Join, Lobby, and Game screens.
- **Backend Infrastructure**: An Express-based Node.js backend using an in-memory `Map` for room storage.
- **UI & Branding**: Pre-styled visual components and Scribble-specific CSS variables.
- **Lobby View**: A basic participant list display that required manual refreshes to update.
- **State Management**: A reactive frontend `roomStore` leveraging `useSyncExternalStore` to connect UI components to the data layer.

## 2. What did you add?

Over four technical iterations, I transformed the scaffold into a secure, synchronized multiplayer experience by adding the following core systems:

- **State Synchronization (Polling)**: Developed a robust synchronization engine using the `useRoomPolling` hook. This replaces manual refreshes with an automatic 2000ms polling cycle that features built-in network failure resilience and automatic cleanup to prevent memory leaks.
- **Role-Based Security & Cheat Prevention**: 
    - **Secure Data Masking**: Implemented backend logic to mask the `secretWord` field in API responses. Only the assigned drawer receives the word, ensuring guessers cannot cheat by inspecting the browser network tab.
    - **Access Control**: Enforced strict host-only permissions for starting, finishing, and restarting rounds.
    - **Join Protection**: Added guards to block new participants (403 Forbidden) once a match has transitioned to the "playing" state.
- **Interactive Drawing Engine**:
    - **Library Integration**: Integrated `react-sketch-canvas` with a custom `ResponsiveCanvas` wrapper.
    - **Deterministic Rendering**: Utilized a fixed **800x600 logical coordinate system** to guarantee that sketches render identically across different screen resolutions and aspect ratios.
- **Gameplay Logic & Lifecycle**:
    - **Scoring Engine**: Built a validation system that awards exactly 100 points for a player's first correct guess each round.
    - **Seniority-Based Rotation**: Implemented a round-robin drawer rotation that deterministically shifts the role based on the order participants joined the room.
    - **Lifecycle Management**: Added manual "Finish Round" and "Restart Game" controls, allowing scores to accumulate across multiple round resets.
    - **Input Sanitization**: Applied Zod schemas across all boundaries to enforce name trimming and length limits.

## 3. Engineering Decisions & Tradeoffs

### Decisions
- **Deterministic Coordinates**: I chose to use a fixed **800x600 logical coordinate system**. This ensures that even if one player is on a mobile device and another on a desktop, the sketch remains visually consistent for all participants.
- **Seniority-Based Rotation**: To ensure fairness and predictability, roles rotate based on the order in which participants joined the room. This avoids the complexity of random selection while providing a clear sequence.
- **Unified State Mapping**: Instead of partial updates, I designed the API to return the full `RoomSnapshot`. While this uses slightly more bandwidth, it significantly simplifies frontend state logic and avoids "out-of-sync" visual errors.

### Tradeoffs
- **Polling vs. WebSockets**: 
    - *Chosen*: Polling (~2s). 
    - *Reason*: Aligned with the "Simplicity First" principle of the project constitution. It avoids the infrastructure overhead of WebSockets while remaining highly reliable in brownfield environments.
    - *Cost*: A maximum of 2 seconds of latency for drawing and guess updates.
- **In-Memory Storage**: 
    - *Chosen*: In-memory `Map`. 
    - *Reason*: Ideal for lab-scale development and rapid iteration.
    - *Cost*: All data (rooms, scores) is lost if the backend server restarts.

## 4. AI Usage & Spec-Driven Development

This project followed a strict **Spec-Driven Development (SDD)** workflow:
1. **Specification**: AI-assisted derivation of technical requirements from high-level user scenarios.
2. **Planning**: Structured research into library integration (`react-sketch-canvas`) and data structures (conditional masking).
3. **Decomposition**: Breaking the plan into granular, testable tasks to ensure incremental delivery.
4. **Implementation & Validation**: Surgical code modifications followed by automated unit testing and manual multi-tab validation.

The use of AI enabled a "security-first" mindset by automatically generating backend guards for every new feature, ensuring the final application was not only functional but also resilient to common exploits.
