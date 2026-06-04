# SpecKit Constitution

This document outlines the core engineering principles, AI usage rules, and review discipline for the Scribble project. Adherence to these mandates is foundational for ensuring the quality, security, and long-term maintainability of the codebase.

## 1. Engineering Principles

### Minimal & Justifiable Changes
Every modification to the codebase must be minimal in scope, focused on the task at hand, and explicitly justifiable. We avoid "gold-plating" or implementing features beyond the current requirement to keep the code lean and manageable.

### Readability & Maintainability
We prioritize code clarity above all else. Code is read much more often than it is written. We use descriptive naming, follow established patterns, and keep functions small and single-purposed. This ensures that the project remains maintainable as it scales.

### Simple & Optimal Solutions
Unnecessary complexity is the enemy of reliability. We favor simple, straightforward solutions that solve the problem effectively. We do not introduce heavy libraries or complex abstractions unless there is a significant, proven benefit.

## 2. AI Usage Rules

### Human Validation Required
While AI is used to accelerate development, every line of generated code must be reviewed and validated by a human. The AI is a tool to assist, but the engineer is responsible for the correctness and architectural alignment of the final output.

### Review Discipline
All changes, whether AI-assisted or manually written, must undergo a rigorous review process. This includes verifying that tests pass, the build is successful, and the logic aligns with the project's architectural patterns.

## 3. Technical Standards

### Architectural Integrity
The Scribble project follows a strict separation of concerns. The backend is organized into API, service, and model layers, while the frontend is divided into components, pages, state management, and services. Any new code must respect these boundaries.

### Consistency & Security
We maintain consistency in coding style and naming conventions throughout the repository. Security is never an afterthought; we rigorously protect sensitive data and implement defensive programming practices like input validation using Zod.

### Continuous Validation
A task is not considered complete until it is fully validated. This involves writing and running automated unit tests for all business logic and performing manual side-by-side browser testing to verify multiplayer synchronization.
