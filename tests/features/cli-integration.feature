Feature: CLI Integration
  As a developer
  I want to use the ADR toolkit CLI
  So that I can manage architecture decisions from the command line

  Scenario: Display help information
    When I run "adrx --help"
    Then I should see the CLI description
    And I should see available commands
    And I should see version information

  Scenario: Display version
    When I run "adrx --version"
    Then I should see the current version number

  Scenario: Run init command
    When I run "adrx init"
    Then the workspace should be initialized
    And I should see creation messages

  Scenario: Run build command
    Given I have initialized workspace with ADRs
    When I run "adrx build"
    Then artifacts should be generated
    And I should see generation message

  Scenario: Run check command with valid ADRs
    Given I have valid ADR files
    When I run "adrx check"
    Then the command should succeed
    And I should see validation success message

  Scenario: Run check command with invalid ADRs
    Given I have invalid ADR files
    When I run "adrx check"
    Then the command should fail
    And I should see validation error messages

  Scenario: Run affected command
    Given I have ADRs and git history
    When I run "adrx affected --base HEAD~1"
    Then I should see affected analysis results

  Scenario: Run pr-comment command
    When I run "adrx pr-comment"
    Then the PR comment functionality should execute

  Scenario: Handle missing required options
    When I run "adrx affected" without --base option
    Then the command should show error about missing base reference

  Scenario: Handle invalid commands
    When I run "adrx invalid-command"
    Then I should see error message about unknown command

  Scenario: Handle command execution errors
    Given I have a corrupted workspace
    When I run any adrx command
    Then errors should be handled gracefully
    And appropriate error messages should be displayed