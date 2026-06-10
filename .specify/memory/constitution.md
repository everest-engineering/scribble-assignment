# Project Constitution: Scribble Game Enhancement

## 1. System Architecture & Constraints
- **Application Type:** Brownfield frontend client interacting with a minimal REST API backend.
- **State Management:** In-memory store on the backend; no persistent external database.
- **Synchronization Model:** The starter application relies on manual page/room refreshing. The core enhancement requires implementing an automated polling-based synchronization mechanism.
- **Tech Stack Leakage Filter:** All specifications must focus strictly on user behavior and observable outcomes. Do not reference specific JavaScript polling libraries or low-level fetch implementation details in the specifications.

## 2. Implementation & Coding Conventions
- **Style Alignment:** Generated code must perfectly match the existing layout, syntax, and naming patterns found in the starter repository.
- **Granularity:** Features must be built incrementally, utilizing granular and descriptive Git commits to establish a transparent review path.
