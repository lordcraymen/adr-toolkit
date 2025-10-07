# Test Documentation

## Test Structure

The test suite is organized into three main categories:

### Unit Tests (`tests/unit/`)
- Test individual functions and modules in isolation
- Fast execution, no external dependencies
- Mock external services and file system operations where needed
- Focus on edge cases and error conditions

**Files:**
- `adr.test.ts` - ADR parsing, validation, and artifact generation
- `init.test.ts` - Workspace initialization functionality 
- `affected.test.ts` - Git diff analysis and ADR affected detection
- `pr-comment.test.ts` - GitHub PR comment generation and posting
- `check.test.ts` - ADR validation logic

### Integration Tests (`tests/integration/`)
- Test multiple components working together
- Use temporary file systems for realistic scenarios
- Test complete workflows end-to-end within the application

**Files:**
- `build-integration.test.ts` - Complete build process with real file I/O
- `workflow-integration.test.ts` - Full ADR lifecycle workflows including git integration

### E2E Tests (`tests/e2e/`)
- Test the complete CLI application from the user's perspective
- Execute actual CLI commands in isolated environments
- Verify complete user workflows

**Files:**
- `cli.test.ts` - Complete CLI command testing with real process execution

## Test Fixtures (`tests/fixtures/`)
- Reusable test data and helper functions
- Sample ADR files with different statuses and configurations
- Mock environment setups for GitHub integration testing

## Feature Files (`tests/features/`)
Gherkin-style feature files describing test scenarios in business language:

- `adr-init.feature` - Workspace initialization scenarios
- `adr-loading.feature` - ADR parsing and loading scenarios
- `adr-validation.feature` - ADR validation scenarios
- `adr-build.feature` - Artifact generation scenarios
- `adr-affected.feature` - Change impact analysis scenarios
- `adr-pr-comment.feature` - GitHub PR comment scenarios
- `cli-integration.feature` - CLI usage scenarios

## Running Tests

### All Tests
```bash
npm run test
```

### Unit Tests Only
```bash
npx vitest run tests/unit/
```

### Integration Tests Only
```bash
npx vitest run tests/integration/
```

### E2E Tests Only
```bash
npx vitest run tests/e2e/
```

### Watch Mode
```bash
npx vitest watch
```

### Coverage Report
```bash
npx vitest run --coverage
```

## Test Coverage Goals

- **Unit Tests**: >90% line coverage for core logic
- **Integration Tests**: Cover all major workflows
- **E2E Tests**: Cover all CLI commands and their combinations

## Future Enhancements

1. **Cucumber Integration**: Connect Gherkin features with step definitions
2. **Performance Tests**: Add benchmarks for large ADR repositories
3. **Accessibility Tests**: Ensure generated markdown is accessible
4. **Cross-Platform Tests**: Test on Windows, macOS, and Linux
5. **Mutation Testing**: Use mutation testing to verify test quality