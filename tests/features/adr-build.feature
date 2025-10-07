Feature: ADR Build Artifacts
  As a developer
  I want to generate ADR artifacts
  So that I can publish and consume architecture decisions

  Background:
    Given I have an initialized ADR workspace
    And I have sample ADR files

  Scenario: Generate all artifacts
    When I run "adrx build"
    Then I should see "docs/adr/index.json" file
    And I should see "docs/adr/ACTIVE.md" file
    And I should see "dist/adr-digest.json" file
    And the command should exit with code 0

  Scenario: Generate index.json with metadata
    Given I have ADR files:
      | filename | title | status | summary | tags | modules |
      | ADR-0001-typescript.md | Use TypeScript | Accepted | Use TS for safety | ["dev", "lang"] | ["src/"] |
      | ADR-0002-react.md | Use React | Proposed | Use React for UI | ["ui"] | ["src/ui/"] |
    When I run "adrx build"
    Then "docs/adr/index.json" should contain:
      | field | value |
      | total | 2 |
      | generatedAt | timestamp |
    And the index should contain ADR with id "ADR-0001"
    And the index should contain ADR with title "Use TypeScript"

  Scenario: Generate ACTIVE.md with active ADRs
    Given I have ADR files:
      | filename | title | status |
      | ADR-0001-active.md | Active Decision | Accepted |
      | ADR-0002-proposed.md | Proposed Decision | Proposed |
      | ADR-0003-rejected.md | Rejected Decision | Rejected |
    When I run "adrx build"
    Then "docs/adr/ACTIVE.md" should contain "Active Decision"
    And "docs/adr/ACTIVE.md" should contain "Proposed Decision"
    And "docs/adr/ACTIVE.md" should not contain "Rejected Decision"

  Scenario: Generate digest with accepted ADRs only
    Given I have ADR files:
      | filename | title | status |
      | ADR-0001-accepted.md | Accepted Decision | Accepted |
      | ADR-0002-approved.md | Approved Decision | Approved |
      | ADR-0003-proposed.md | Proposed Decision | Proposed |
      | ADR-0004-rejected.md | Rejected Decision | Rejected |
    When I run "adrx build"
    Then "dist/adr-digest.json" should contain 2 ADRs
    And the digest should contain "Accepted Decision"
    And the digest should contain "Approved Decision"
    And the digest should not contain "Proposed Decision"
    And the digest should not contain "Rejected Decision"

  Scenario: Handle empty ADR directory
    Given I have no ADR files
    When I run "adrx build"
    Then "docs/adr/index.json" should contain total 0
    And "docs/adr/ACTIVE.md" should be empty table
    And "dist/adr-digest.json" should contain count 0

  Scenario: Generate with proper timestamps
    When I run "adrx build"
    Then all generated files should have valid ISO timestamps
    And timestamps should be recent

  Scenario: Overwrite existing artifacts
    Given I have existing artifact files
    When I run "adrx build"
    Then the existing files should be overwritten
    And the new files should contain current data
