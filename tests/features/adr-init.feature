Feature: ADR Workspace Initialization
  As a developer
  I want to initialize ADR workspace structure
  So that I can start documenting architecture decisions

  Background:
    Given I have a clean project directory

  Scenario: Initialize workspace from scratch
    When I run "adrx init"
    Then I should see a "docs/adr" directory
    And I should see "docs/adr/templates/ADR-0000-template.md" file
    And I should see "docs/adr/README.md" file
    And I should see ".dependency-cruiser.js" file
    And I should see ".github/PULL_REQUEST_TEMPLATE.md" file
    And I should see "docs/ADR_GUIDELINES.md" file
    And the command should exit with code 0

  Scenario: Initialize workspace with existing files
    Given I have existing files:
      | file | content |
      | docs/adr/README.md | Custom README |
      | .dependency-cruiser.js | Custom config |
    When I run "adrx init"
    Then the existing files should remain unchanged
    And new missing files should be created
    And the command should exit with code 0

  Scenario: Initialize workspace creates proper directory structure
    When I run "adrx init"
    Then the directory structure should be:
      | path |
      | docs/adr |
      | docs/adr/templates |
      | .github |

  Scenario: Initialize workspace with proper file permissions
    When I run "adrx init"
    Then all created files should be readable
    And all created directories should be writable
