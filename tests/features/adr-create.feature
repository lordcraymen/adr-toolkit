Feature: ADR Creation
  As a developer or coding agent
  I want to create new ADRs programmatically
  So that I can document architecture decisions without manual markdown formatting

  Background:
    Given I have an initialized ADR workspace

  Scenario: Create ADR with minimal CLI options
    When I run "adrx create --title 'Use TypeScript' --summary 'We will use TypeScript for better type safety'"
    Then I should see "Created ADR: ADR-0001" in the output
    And I should see "docs/adr/ADR-0001-use-typescript.md" file
    And the ADR file should contain "title: \"ADR-0001: Use TypeScript\""
    And the ADR file should contain "status: Proposed"
    And the ADR file should contain "We will use TypeScript for better type safety"
    And the command should exit with code 0

  Scenario: Create ADR with all CLI options
    When I run "adrx create --title 'Use React' --summary 'We will use React for the frontend' --status 'Accepted' --tags 'frontend,ui' --modules 'src/ui,src/components'"
    Then I should see "Created ADR: ADR-0001" in the output
    And the ADR file should contain "status: Accepted"
    And the ADR file should contain "tags:"
    And the ADR file should contain "  - frontend"
    And the ADR file should contain "  - ui"
    And the ADR file should contain "modules:"
    And the ADR file should contain "  - src/ui"
    And the ADR file should contain "  - src/components"

  Scenario: Create ADR from JSON input
    When I run "adrx create --json '{\"title\": \"Use GraphQL\", \"summary\": \"GraphQL provides better API flexibility\", \"status\": \"Proposed\", \"tags\": [\"api\", \"graphql\"]}'"
    Then I should see "Created ADR: ADR-0001" in the output
    And the ADR file should contain "Use GraphQL"
    And the ADR file should contain "GraphQL provides better API flexibility"
    And the ADR file should contain "  - api"
    And the ADR file should contain "  - graphql"

  Scenario: Sequential ADR ID generation
    Given I have existing ADR files:
      | filename | title | status |
      | ADR-0001-existing.md | Existing Decision | Accepted |
      | ADR-0005-gap.md | Gap Decision | Approved |
    When I run "adrx create --title 'New Decision' --summary 'This should get the next ID'"
    Then I should see "Created ADR: ADR-0006" in the output

  Scenario: Fail with missing required fields
    When I run "adrx create --title 'Missing Summary'"
    Then I should see "Both title and summary are required" in the error output
    And the command should exit with code 1

  Scenario: Fail with invalid status
    When I run "adrx create --title 'Valid Title' --summary 'Valid summary' --status 'InvalidStatus'"
    Then I should see "Invalid status" in the error output
    And the command should exit with code 1

  Scenario: Fail with summary too long
    When I run "adrx create --title 'Valid Title' --summary 'This summary is way too long and exceeds the maximum allowed length of 300 characters. It keeps going and going and going and going and going and going and going and going and going and going and going and going and going and going and going and going and going and going and going.'"
    Then I should see "Summary exceeds maximum length" in the error output
    And the command should exit with code 1

  Scenario: Prevent duplicate files
    When I run "adrx create --title 'Test Decision' --summary 'First ADR with this title'"
    And I manually create "docs/adr/ADR-0002-test-decision.md"
    And I run "adrx create --title 'Test Decision' --summary 'Second ADR with same title'"
    Then I should see "ADR file already exists" in the error output
    And the command should exit with code 1

  Scenario: Integration with validation and build
    When I run "adrx create --title 'Validated Decision' --summary 'This ADR should pass validation' --status 'Accepted'"
    And I run "adrx check"
    Then the check command should exit with code 0
    And I should see "All 1 ADRs look good" in the check output
    When I run "adrx build"
    Then I should see "Generated ADR artifacts for 1 decisions" in the build output
    And I should see "docs/adr/index.json" file
    And I should see "dist/adr-digest.json" file
    And the digest should contain "Validated Decision"

  Scenario: Create ADR in empty workspace
    Given I have no existing ADR files
    When I run "adrx create --title 'Bootstrap Decision' --summary 'First ADR in empty workspace'"
    Then I should see "Created ADR: ADR-0001" in the output
    And I should see "docs/adr/ADR-0001-bootstrap-decision.md" file

  Scenario: JSON input validation
    When I run "adrx create --json 'invalid json'"
    Then I should see "Invalid JSON input" in the error output
    And the command should exit with code 1
    
    When I run "adrx create --json '\"not an object\"'"
    Then I should see "JSON input must be an object" in the error output
    And the command should exit with code 1

  Scenario: Default values in generated content
    When I run "adrx create --title 'Default Test' --summary 'Testing default content generation'"
    Then the ADR file should contain "# Context"
    And the ADR file should contain "Describe the forces at play, relevant background and constraints"
    And the ADR file should contain "# Decision"
    And the ADR file should contain "State the decision that was made"
    And the ADR file should contain "# Consequences" 
    And the ADR file should contain "Explain the positive and negative outcomes"
    And the ADR file should contain "# References"
    And the ADR file should contain "Link to related ADRs or documentation"