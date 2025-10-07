# Agent Guidelines

## Preparation
- Check the Architectural Decision Records in /docs/adr before and after coding to maintain coding style and architectural consistency

## Development Rules
- Prefer deterministic CLI output
- Never assume network connectivity when generating ADR artifacts
- Document manual steps in `docs/adr/README.md` when deviating from default workflow

## Git Workflow Guidelines
- **Push Early and Often**: Create feature branches and push regularly to enable collaboration and backup
- **Meaningful Commits**: Use conventional commit messages (feat:, fix:, docs:, etc.) with clear descriptions
- **Branch Strategy**: Use descriptive branch names like `feature/configurable-status-management`
- **ADR Workflow**: When making architectural decisions, create an ADR first, then implement
- **Incremental Progress**: Push incremental work rather than waiting for complete features

## Testing Standards
- Maintain 100% test pass rate
- Use comprehensive BDD scenarios in English
- Ensure three-tier testing (Unit/Integration/E2E)
- Mock external dependencies (Git, GitHub API)
