Feature: Configurable Status Management
  As a team lead
  I want to customize ADR status workflows
  So that the tool matches our organization's decision-making process

  Background:
    Given I have an initialized ADR workspace

  Scenario: Use default statuses when no configuration exists
    Given I have no configuration file
    When I create an ADR with status "Accepted"
    And I run "adrx check"
    Then the command should exit with code 0
    And I should see "All 1 ADRs look good"

  Scenario: Define custom statuses in configuration
    Given I have a configuration file:
      """
      {
        "statuses": {
          "draft": { "active": true, "includeInDigest": false },
          "security-review": { "active": true, "includeInDigest": false },
          "approved": { "active": true, "includeInDigest": true },
          "implemented": { "active": false, "includeInDigest": true },
          "archived": { "active": false, "includeInDigest": false }
        }
      }
      """
    When I create ADRs with custom statuses:
      | filename | status | title |
      | ADR-0001-draft.md | draft | Draft Decision |
      | ADR-0002-security.md | security-review | Security Decision |
      | ADR-0003-approved.md | approved | Approved Decision |
    And I run "adrx check"
    Then the command should exit with code 0
    And all ADRs should be valid

  Scenario: Reject undefined statuses with custom configuration
    Given I have a configuration file with statuses "draft, approved, implemented"
    When I create an ADR with status "rejected"
    And I run "adrx check"
    Then the command should exit with code 1
    And I should see error "Unknown status \"rejected\""

  Scenario: Generate ACTIVE.md based on custom active settings
    Given I have a configuration file:
      """
      {
        "statuses": {
          "in-progress": { "active": true, "includeInDigest": false },
          "completed": { "active": false, "includeInDigest": true },
          "archived": { "active": false, "includeInDigest": false }
        }
      }
      """
    And I have ADRs with statuses:
      | filename | status | title |
      | ADR-0001-active.md | in-progress | Active Decision |
      | ADR-0002-done.md | completed | Completed Decision |
      | ADR-0003-old.md | archived | Archived Decision |
    When I run "adrx build"
    Then "docs/adr/ACTIVE.md" should contain "Active Decision"
    And "docs/adr/ACTIVE.md" should not contain "Completed Decision"
    And "docs/adr/ACTIVE.md" should not contain "Archived Decision"

  Scenario: Generate digest.json based on custom includeInDigest settings
    Given I have a configuration file:
      """
      {
        "statuses": {
          "draft": { "active": true, "includeInDigest": false },
          "approved": { "active": true, "includeInDigest": true },
          "implemented": { "active": false, "includeInDigest": true }
        }
      }
      """
    And I have ADRs with statuses:
      | filename | status | title |
      | ADR-0001-draft.md | draft | Draft Decision |
      | ADR-0002-approved.md | approved | Approved Decision |
      | ADR-0003-done.md | implemented | Implemented Decision |
    When I run "adrx build"
    Then "dist/adr-digest.json" should contain 2 ADRs
    And the digest should contain "Approved Decision"
    And the digest should contain "Implemented Decision"
    And the digest should not contain "Draft Decision"

  Scenario: Enforce workflow transitions with strict mode
    Given I have a configuration file with strict workflow:
      """
      {
        "statuses": {
          "draft": { 
            "active": true, 
            "includeInDigest": false,
            "allowTransitionTo": ["review", "rejected"]
          },
          "review": { 
            "active": true, 
            "includeInDigest": false,
            "allowTransitionTo": ["approved", "rejected"]
          },
          "approved": { 
            "active": true, 
            "includeInDigest": true,
            "allowTransitionTo": ["implemented"]
          },
          "implemented": { 
            "active": false, 
            "includeInDigest": true,
            "allowTransitionTo": []
          },
          "rejected": { 
            "active": false, 
            "includeInDigest": false,
            "allowTransitionTo": []
          }
        },
        "validation": {
          "strictWorkflow": true
        }
      }
      """
    When I create an ADR with status "draft"
    And I update the ADR status to "implemented"
    And I run "adrx check"
    Then the command should exit with code 1
    And I should see error "Invalid status transition from \"draft\" to \"implemented\""

  Scenario: Allow arbitrary transitions without strict mode
    Given I have a configuration file with non-strict workflow:
      """
      {
        "statuses": {
          "draft": { "active": true, "includeInDigest": false },
          "approved": { "active": true, "includeInDigest": true },
          "implemented": { "active": false, "includeInDigest": true }
        },
        "validation": {
          "strictWorkflow": false
        }
      }
      """
    When I create an ADR with status "draft"
    And I update the ADR status to "implemented"
    And I run "adrx check"
    Then the command should exit with code 0
    And I should see "All 1 ADRs look good"

  Scenario: Custom summary length limits
    Given I have a configuration file:
      """
      {
        "statuses": {
          "approved": { "active": true, "includeInDigest": true }
        },
        "validation": {
          "summaryLimit": 100
        }
      }
      """
    When I create an ADR with a 150-character summary
    And I run "adrx check"
    Then the command should exit with code 1
    And I should see error "Summary too long (150 > 100)"

  Scenario: Custom required fields
    Given I have a configuration file:
      """
      {
        "statuses": {
          "approved": { "active": true, "includeInDigest": true }
        },
        "validation": {
          "requiredFields": ["title", "status", "summary", "owner", "reviewers"]
        }
      }
      """
    When I create an ADR without "owner" field
    And I run "adrx check"
    Then the command should exit with code 1
    And I should see error "Missing required field: owner"

  Scenario: Initialize default configuration
    Given I have no configuration file
    When I run "adrx config init"
    Then I should see ".adrx.config.json created with default configuration"
    And ".adrx.config.json" should contain default statuses

  Scenario: Validate configuration file
    Given I have an invalid configuration file:
      """
      {
        "statuses": {
          "invalid-status-name-with-spaces": { "active": "not-boolean" }
        }
      }
      """
    When I run "adrx config validate"
    Then the command should exit with code 1
    And I should see error "Configuration validation failed"
    And I should see error "Status names must match pattern"
    And I should see error "active must be boolean"

  Scenario: Show current configuration
    Given I have a configuration file with custom statuses
    When I run "adrx config show"
    Then I should see the current configuration in JSON format
    And I should see all defined statuses with their properties

  Scenario: Add new status via CLI
    Given I have a basic configuration file
    When I run "adrx config add-status experimental --active --no-digest"
    Then ".adrx.config.json" should contain status "experimental"
    And the "experimental" status should have "active": true
    And the "experimental" status should have "includeInDigest": false

  Scenario: JIRA integration mapping
    Given I have a configuration file with JIRA integration:
      """
      {
        "statuses": {
          "security-review": { "active": true, "includeInDigest": false },
          "approved": { "active": true, "includeInDigest": true }
        },
        "integrations": {
          "jira": {
            "statusMapping": {
              "security-review": "In Security Review",
              "approved": "Ready for Development"
            },
            "webhookUrl": "https://company.atlassian.net/webhook"
          }
        }
      }
      """
    When I create an ADR with status "security-review"
    And I run "adrx build"
    Then a webhook should be sent to JIRA with mapped status "In Security Review"

  Scenario: Hierarchical configuration lookup
    Given I have a workspace-level configuration in the parent directory
    And I have a project-level configuration in the current directory
    When I run "adrx check"
    Then the project-level configuration should take precedence
    And workspace-level settings should be inherited where not overridden

  Scenario: Migration from hard-coded statuses
    Given I have existing ADRs with hard-coded statuses:
      | filename | status |
      | ADR-0001-old.md | Accepted |
      | ADR-0002-old.md | Rejected |
    When I run "adrx config migrate"
    Then ".adrx.config.json" should be created
    And the configuration should include all existing statuses
    And all existing ADRs should still validate successfully