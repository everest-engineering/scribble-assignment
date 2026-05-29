# Scribble Assignment Constitution

## Code Quality
- TypeScript strict mode should be followed
- Use React functional components with hooks
- Keep code modular and readable
- Avoid unnecessary complexity
- Do not rewrite the starter project from scratch

## Architecture
- Extend the existing frontend and backend structure
- Use polling for synchronization instead of WebSockets
- Keep in-memory room storage
- Avoid adding unnecessary dependencies

## Validation
- Validate player names
- Validate room codes
- Validate guesses
- Reject empty or whitespace-only input

## Testing & Review
- Manually test multiplayer flows using multiple browser tabs
- Validate implementation against acceptance criteria
- Keep implementation aligned with spec, plan, and tasks
- Review AI-generated output before committing

## Workflow Discipline
- Follow Spec → Plan → Tasks → Implement workflow
- Update documentation when requirements change
- Keep commits granular and meaningful

## Out of Scope
- No WebSockets
- No authentication
- No database
- No Docker or deployment setup
- No rewrite of starter architecture

## Governance
This constitution guides all implementation decisions for the Scribble assignment. All features and changes should comply with these rules.

**Version:** 1.0.0