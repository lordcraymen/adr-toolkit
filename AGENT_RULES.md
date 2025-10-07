# Agent Guidelines

## Development Rules
- Prefer deterministic CLI output
- Never assume network connectivity when generating ADR artifacts
- Document manual steps in `docs/adr/README.md` when deviating from default workflow

## Testing Standards
- Maintain 100% test pass rate
- Use comprehensive BDD scenarios in German
- Ensure three-tier testing (Unit/Integration/E2E)
- Mock external dependencies (Git, GitHub API)
