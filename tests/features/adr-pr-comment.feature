Feature: GitHub PR Comments
  As a developer
  I want to post ADR digests to pull requests
  So that reviewers can see relevant architecture decisions

  Background:
    Given I have an initialized ADR workspace

  Scenario: Post PR comment with accepted ADRs
    Given I have accepted ADR files:
      | filename | title | summary |
      | ADR-0001-api.md | API Design | REST API design decisions |
      | ADR-0002-db.md | Database Choice | PostgreSQL selection rationale |
    And I have GitHub environment variables:
      | variable | value |
      | GITHUB_TOKEN | valid-token |
      | GITHUB_REPOSITORY | owner/repo |
      | GITHUB_REF | refs/pull/123/merge |
    When I run "adrx pr-comment"
    Then a PR comment should be posted
    And the comment should contain ADR digest table
    And the comment should contain "API Design"
    And the comment should contain "Database Choice"

  Scenario: Skip PR comment without GitHub token
    Given I have accepted ADR files
    And I have no GITHUB_TOKEN environment variable
    When I run "adrx pr-comment"
    Then no PR comment should be posted
    And I should see "GITHUB_TOKEN missing, skipping comment"
    And the command should exit with code 0

  Scenario: Skip PR comment without repository info
    Given I have accepted ADR files
    And I have GITHUB_TOKEN but no GITHUB_REPOSITORY
    When I run "adrx pr-comment"
    Then no PR comment should be posted
    And I should see "GITHUB_REPOSITORY missing, skipping comment"

  Scenario: Skip PR comment without PR context
    Given I have accepted ADR files
    And I have GITHUB_TOKEN and GITHUB_REPOSITORY
    And I have no PR number environment variables
    When I run "adrx pr-comment"
    Then no PR comment should be posted
    And I should see "Pull request context missing, skipping comment"

  Scenario: Skip PR comment with no accepted ADRs
    Given I have no accepted ADR files
    And I have complete GitHub environment
    When I run "adrx pr-comment"
    Then no PR comment should be posted
    And I should see "No accepted ADRs found, nothing to comment"

  Scenario: Handle GitHub API failure gracefully
    Given I have accepted ADR files
    And I have complete GitHub environment
    And the GitHub API returns error
    When I run "adrx pr-comment"
    Then the command should not fail
    And I should see API error message

  Scenario: Detect PR number from different environment variables
    Given I have accepted ADR files
    And I have GitHub environment with PR number in:
      | source | variable | value |
      | GITHUB_REF | GITHUB_REF | refs/pull/456/merge |
      | PR_NUMBER | PR_NUMBER | 789 |
      | GITHUB_EVENT_NUMBER | GITHUB_EVENT_NUMBER | 101 |
    When I run "adrx pr-comment"
    Then the correct PR number should be detected

  Scenario: Format PR comment correctly
    Given I have accepted ADR with long summary
    When I run "adrx pr-comment"
    Then the comment should have proper markdown table format
    And long summaries should be truncated
    And pipe characters should be escaped
    And the comment should include generation timestamp