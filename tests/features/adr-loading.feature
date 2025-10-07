Feature: ADR Parsing and Loading
  As a developer
  I want to parse and load ADR files
  So that I can process architecture decisions programmatically

  Background:
    Given I have an initialized ADR workspace

  Scenario: Load valid ADR files
    Given I have ADR files:
      | filename | title | status | summary |
      | ADR-0001-use-typescript.md | Use TypeScript | Accepted | We will use TypeScript for type safety |
      | ADR-0002-use-react.md | Use React | Proposed | We propose using React for UI |
    When I load the ADRs
    Then I should get 2 ADR documents
    And the first ADR should have id "ADR-0001"
    And the first ADR should have title "Use TypeScript"
    And the first ADR should have status "Accepted"

  Scenario: Parse ADR with YAML frontmatter
    Given I have an ADR file "ADR-0001-test.md" with frontmatter:
      """
      ---
      title: "Test Decision"
      status: "Accepted"
      date: "2024-01-01"
      tags:
        - architecture
        - testing
      modules:
        - src/test
      summary: >-
        This is a test decision for validation.
      ---
      
      # Context
      Test context
      
      # Decision
      Test decision
      """
    When I load the ADRs
    Then the ADR should have title "Test Decision"
    And the ADR should have status "Accepted"
    And the ADR should have tags ["architecture", "testing"]
    And the ADR should have modules ["src/test"]

  Scenario: Handle ADR without frontmatter
    Given I have an ADR file "ADR-0001-no-frontmatter.md" with content:
      """
      # Use TypeScript
      
      We should use TypeScript for better type safety.
      """
    When I load the ADRs
    Then the ADR should have title "Use TypeScript"
    And the ADR should have empty status
    And the ADR should have empty summary

  Scenario: Infer ADR ID from filename
    Given I have ADR files with names:
      | filename | expected_id |
      | ADR-0001-test.md | ADR-0001 |
      | adr_002_example.md | ADR-0002 |
      | adr-003-another.md | ADR-0003 |
      | 0004-simple.md | ADR-0004 |
    When I load the ADRs
    Then the ADR IDs should match the expected values

  Scenario: Handle invalid ADR files gracefully
    Given I have invalid ADR files:
      | filename | issue |
      | empty.md | empty file |
      | invalid-yaml.md | malformed YAML |
    When I load the ADRs
    Then the loading should not fail
    And invalid files should be handled gracefully