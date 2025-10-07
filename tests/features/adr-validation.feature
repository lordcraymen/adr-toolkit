Feature: ADR Validation
  As a developer
  I want to validate ADR files
  So that I can ensure they meet quality standards

  Background:
    Given I have an initialized ADR workspace

  Scenario: Validate correct ADR files
    Given I have valid ADR files:
      | filename | title | status | summary |
      | ADR-0001-valid.md | Valid Decision | Accepted | This is a valid decision with proper summary |
    When I run "adrx check"
    Then the command should exit with code 0
    And I should see "All 1 ADRs look good"

  Scenario: Detect missing title
    Given I have an ADR file without title:
      """
      ---
      status: "Accepted"
      summary: "Summary without title"
      ---
      
      Content without title
      """
    When I run "adrx check"
    Then the command should exit with code 1
    And I should see error "Missing title in frontmatter or heading"

  Scenario: Detect missing status
    Given I have an ADR file without status:
      """
      ---
      title: "Decision Without Status"
      summary: "Summary without status"
      ---
      
      # Decision Without Status
      """
    When I run "adrx check"
    Then the command should exit with code 1
    And I should see error "Missing status in frontmatter"

  Scenario: Detect missing summary
    Given I have an ADR file without summary:
      """
      ---
      title: "Decision Without Summary"
      status: "Accepted"
      ---
      
      # Decision Without Summary
      """
    When I run "adrx check"
    Then the command should exit with code 1
    And I should see error "Missing summary in frontmatter"

  Scenario: Detect invalid status
    Given I have an ADR file with invalid status:
      """
      ---
      title: "Invalid Status Decision"
      status: "InvalidStatus"
      summary: "Decision with invalid status"
      ---
      """
    When I run "adrx check"
    Then the command should exit with code 1
    And I should see error "Unknown status \"InvalidStatus\""

  Scenario: Validate summary length limit
    Given I have an ADR file with too long summary:
      """
      ---
      title: "Long Summary Decision"
      status: "Accepted"
      summary: "This is a very long summary that exceeds the 300 character limit. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore."
      ---
      """
    When I run "adrx check"
    Then the command should exit with code 1
    And I should see error "Summary too long"

  Scenario: Validate valid statuses
    Given I have ADR files with statuses:
      | status |
      | Accepted |
      | Approved |
      | Proposed |
      | Draft |
      | Rejected |
      | Deprecated |
      | Superseded |
    When I run "adrx check"
    Then all statuses should be valid
    And the command should exit with code 0

  Scenario: Report multiple validation errors
    Given I have multiple invalid ADR files
    When I run "adrx check"
    Then I should see multiple error messages
    And the command should exit with code 1