Feature: ADR Affected Analysis
  As a developer
  I want to identify ADRs affected by code changes
  So that I can update relevant architecture decisions

  Background:
    Given I have an initialized ADR workspace
    And I have a git repository

  Scenario: Detect ADRs affected by direct file changes
    Given I have ADR files:
      | filename | title |
      | ADR-0001-test.md | Test Decision |
      | ADR-0002-other.md | Other Decision |
    And I have changed files:
      | filename |
      | docs/adr/ADR-0001-test.md |
    When I run "adrx affected --base HEAD~1"
    Then the affected list should contain "docs/adr/ADR-0001-test.md"
    And the affected list should not contain "docs/adr/ADR-0002-other.md"

  Scenario: Detect ADRs affected by module changes
    Given I have an ADR file with modules:
      """
      ---
      title: "Frontend Architecture"
      status: "Accepted"
      modules:
        - src/ui/
        - src/components/
      summary: "Frontend architecture decisions"
      ---
      """
    And I have changed files:
      | filename |
      | src/ui/Button.tsx |
      | src/components/Modal.tsx |
    When I run "adrx affected --base HEAD~1"
    Then the ADR should be marked as affected

  Scenario: Detect ADRs affected by tag matches
    Given I have an ADR file with tags:
      """
      ---
      title: "Database Architecture"
      status: "Accepted"
      tags:
        - database
        - postgres
      summary: "Database architecture decisions"
      ---
      """
    And I have changed files:
      | filename |
      | src/database/migrations/001_init.sql |
      | docs/postgres-setup.md |
    When I run "adrx affected --base HEAD~1"
    Then the ADR should be marked as affected

  Scenario: Handle non-existent base reference
    When I run "adrx affected --base nonexistent-ref"
    Then the command should handle the error gracefully
    And should return empty results

  Scenario: Complex affected analysis
    Given I have multiple ADR files with different modules and tags
    And I have various changed files
    When I run "adrx affected --base HEAD~1"
    Then the results should show:
      | field | value |
      | changed | list of changed files |
      | affected | list of affected ADRs |
    And the results should be in JSON format

  Scenario: No changes result in no affected ADRs
    Given I have ADR files but no changes
    When I run "adrx affected --base HEAD"
    Then the affected list should be empty
    And the changed list should be empty

  Scenario: Path normalization for Windows compatibility
    Given I have ADR with modules containing backslashes
    And I have changed files with forward slashes
    When I run "adrx affected --base HEAD~1"
    Then path matching should work correctly regardless of slash type
