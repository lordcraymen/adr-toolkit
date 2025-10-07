import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

// TODO: These imports will need to be updated when we implement the config system
// import { loadConfig, validateAdrsWithConfig, createConfiguredDigest } from '../../src/config.js';
// import { runCheckWithConfig } from '../../src/check.js';

describe('Configuration-Driven Status Management', () => {
  let tempDir: string;
  
  beforeEach(async () => {
    tempDir = join(tmpdir(), `adr-config-test-${Date.now()}`);
    await mkdir(tempDir, { recursive: true });
    await mkdir(join(tempDir, 'docs', 'adr'), { recursive: true });
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  describe('Configuration Loading', () => {
    it.todo('should load default configuration when no config file exists');
    
    it.todo('should load custom configuration from .adrx.config.json');
    
    it.todo('should validate configuration schema');
    
    it.todo('should reject invalid configuration files');
    
    it.todo('should support hierarchical configuration lookup (project > workspace > global)');

    it.todo('should merge configurations with proper precedence');
  });

  describe('Custom Status Validation', () => {
    it.todo('should validate ADRs against custom status definitions', async () => {
      // Test scenario:
      // - Custom config with statuses: draft, security-review, approved, implemented, archived
      // - ADRs with these custom statuses should validate successfully
      // - ADRs with non-configured statuses should fail validation
      
      const customConfig = {
        statuses: {
          'draft': { active: true, includeInDigest: false },
          'security-review': { active: true, includeInDigest: false, requiresApproval: true },
          'approved': { active: true, includeInDigest: true },
          'implemented': { active: false, includeInDigest: true },
          'archived': { active: false, includeInDigest: false }
        }
      };

      await writeFile(join(tempDir, '.adrx.config.json'), JSON.stringify(customConfig, null, 2));

      const validAdr = `---
title: "Security Review ADR"
status: "security-review"
summary: "This ADR is under security review"
---
# Security Review ADR`;

      const invalidAdr = `---
title: "Invalid Status ADR"
status: "rejected"
summary: "This uses the old hard-coded status"
---
# Invalid Status ADR`;

      await writeFile(join(tempDir, 'docs', 'adr', 'ADR-0001-valid.md'), validAdr);
      await writeFile(join(tempDir, 'docs', 'adr', 'ADR-0002-invalid.md'), invalidAdr);

      // const result = await runCheckWithConfig(tempDir);
      // expect(result.ok).toBe(false); // Should fail due to invalid status
      // expect(result.errors.some(e => e.message.includes('rejected'))).toBe(true);
    });

    it.todo('should support case-insensitive status matching');
    
    it.todo('should validate summary length limits from configuration');
    
    it.todo('should validate required fields from configuration');
  });

  describe('Workflow Enforcement', () => {
    it.todo('should enforce status transitions when strictWorkflow is enabled', async () => {
      // Test scenario:
      // - Config with allowTransitionTo rules
      // - ADR status changes should respect transition rules
      // - Invalid transitions should be rejected
      
      const workflowConfig = {
        statuses: {
          'draft': { 
            active: true, 
            includeInDigest: false,
            allowTransitionTo: ['review', 'rejected']
          },
          'review': { 
            active: true, 
            includeInDigest: false,
            allowTransitionTo: ['approved', 'rejected']
          },
          'approved': { 
            active: true, 
            includeInDigest: true,
            allowTransitionTo: ['implemented', 'superseded']
          },
          'implemented': { 
            active: false, 
            includeInDigest: true,
            allowTransitionTo: ['superseded']
          }
        },
        validation: {
          strictWorkflow: true
        }
      };

      // Test valid transition: draft -> review
      // Test invalid transition: draft -> implemented (should fail)
    });

    it.todo('should allow arbitrary transitions when strictWorkflow is disabled');
  });

  describe('Artifact Generation with Custom Statuses', () => {
    it.todo('should generate ACTIVE.md based on custom active status configuration', async () => {
      // Test scenario:
      // - Custom statuses with different active settings
      // - ACTIVE.md should include only statuses marked as active: true
      
      const config = {
        statuses: {
          'in-progress': { active: true, includeInDigest: false },
          'completed': { active: false, includeInDigest: true },
          'archived': { active: false, includeInDigest: false }
        }
      };

      const adrs = [
        { status: 'in-progress', title: 'Active ADR' },
        { status: 'completed', title: 'Completed ADR' },
        { status: 'archived', title: 'Archived ADR' }
      ];

      // Generated ACTIVE.md should contain:
      // - "Active ADR" (in-progress is active: true)
      // Should NOT contain:
      // - "Completed ADR" (completed is active: false)
      // - "Archived ADR" (archived is active: false)
    });

    it.todo('should generate digest.json based on custom includeInDigest configuration', async () => {
      // Test scenario:
      // - Custom statuses with different includeInDigest settings
      // - digest.json should include only statuses marked as includeInDigest: true
      
      const config = {
        statuses: {
          'draft': { active: true, includeInDigest: false },
          'approved': { active: true, includeInDigest: true },
          'implemented': { active: false, includeInDigest: true }
        }
      };

      // Generated digest.json should contain:
      // - ADRs with status "approved" and "implemented"
      // Should NOT contain:
      // - ADRs with status "draft"
    });

    it.todo('should maintain backward compatibility when no config is present');
  });

  describe('Configuration CLI Commands', () => {
    it.todo('should initialize default configuration with adrx config init');
    
    it.todo('should validate configuration with adrx config validate');
    
    it.todo('should show current configuration with adrx config show');
    
    it.todo('should add new status with adrx config add-status');
  });

  describe('Integration Features', () => {
    it.todo('should support JIRA status mapping configuration', async () => {
      const integrationConfig = {
        statuses: {
          'security-review': { active: true, includeInDigest: false },
          'approved': { active: true, includeInDigest: true }
        },
        integrations: {
          jira: {
            statusMapping: {
              'security-review': 'In Security Review',
              'approved': 'Approved'
            },
            webhookUrl: 'https://company.atlassian.net/webhook'
          }
        }
      };

      // Test that status changes trigger JIRA webhook calls
      // Test that status mapping works correctly
    });

    it.todo('should support Confluence integration configuration');
    
    it.todo('should validate integration webhook URLs');
  });

  describe('Error Handling and Edge Cases', () => {
    it.todo('should handle malformed configuration files gracefully');
    
    it.todo('should provide clear error messages for schema validation failures');
    
    it.todo('should handle missing required configuration properties');
    
    it.todo('should warn about unknown configuration properties');
    
    it.todo('should handle configuration file permission issues');
  });

  describe('Migration Support', () => {
    it.todo('should provide migration path from hard-coded statuses to configuration');
    
    it.todo('should generate default configuration based on existing ADR statuses');
    
    it.todo('should validate existing ADRs against new configuration');
  });
});