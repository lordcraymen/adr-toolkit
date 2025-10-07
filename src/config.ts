import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathExists } from './fs-utils.js';

export interface StatusConfig {
  active: boolean;
  includeInDigest: boolean;
  description?: string;
  color?: string;
  requiresApproval?: boolean;
  allowTransitionTo?: string[];
}

export interface ValidationConfig {
  summaryLimit?: number;
  strictWorkflow?: boolean;
  requiredFields?: string[];
}

export interface IntegrationConfig {
  jira?: {
    statusMapping?: Record<string, string>;
    webhookUrl?: string;
  };
  confluence?: {
    spaceKey?: string;
    parentPageId?: string;
  };
}

export interface AdrConfig {
  statuses: Record<string, StatusConfig>;
  validation?: ValidationConfig;
  integrations?: IntegrationConfig;
}

// Default configuration that matches current hard-coded behavior
const DEFAULT_CONFIG: AdrConfig = {
  statuses: {
    'draft': { active: true, includeInDigest: false },
    'proposed': { active: true, includeInDigest: false },
    'accepted': { active: true, includeInDigest: true },
    'approved': { active: true, includeInDigest: true },
    'rejected': { active: false, includeInDigest: false },
    'superseded': { active: false, includeInDigest: false },
    'deprecated': { active: false, includeInDigest: false }
  },
  validation: {
    summaryLimit: 300,
    strictWorkflow: false,
    requiredFields: ['title', 'status', 'summary']
  }
};

const CONFIG_FILENAMES = ['.adrx.config.json', 'adrx.config.json'];

/**
 * Load ADR configuration with hierarchical lookup and fallback to defaults
 */
export async function loadConfig(cwd: string = process.cwd()): Promise<AdrConfig> {
  // Try to find configuration file in current directory
  for (const filename of CONFIG_FILENAMES) {
    const configPath = join(cwd, filename);
    if (await pathExists(configPath)) {
      try {
        const configContent = await readFile(configPath, 'utf8');
        const userConfig = JSON.parse(configContent) as Partial<AdrConfig>;
        
        // Merge user config with defaults
        const mergedConfig = mergeConfigs(DEFAULT_CONFIG, userConfig);
        
        // Validate the merged configuration
        validateConfig(mergedConfig);
        
        return mergedConfig;
      } catch (error) {
        throw new Error(`Failed to load configuration from ${configPath}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }
  
  // No config file found, return defaults
  return DEFAULT_CONFIG;
}

/**
 * Merge user configuration with default configuration
 */
function mergeConfigs(defaultConfig: AdrConfig, userConfig: Partial<AdrConfig>): AdrConfig {
  return {
    // If user provides statuses, replace completely (don't merge with defaults)
    statuses: userConfig.statuses ? userConfig.statuses : defaultConfig.statuses,
    validation: { ...defaultConfig.validation, ...userConfig.validation },
    integrations: { ...defaultConfig.integrations, ...userConfig.integrations }
  };
}

/**
 * Validate configuration structure and values
 */
export function validateConfig(config: AdrConfig): void {
  // Validate statuses
  if (!config.statuses || Object.keys(config.statuses).length === 0) {
    throw new Error('Configuration must define at least one status');
  }
  
  for (const [statusName, statusConfig] of Object.entries(config.statuses)) {
    // Validate status name format
    if (!/^[a-zA-Z][a-zA-Z0-9-_]*$/.test(statusName)) {
      throw new Error(`Invalid status name "${statusName}". Status names must start with a letter and contain only letters, numbers, hyphens, and underscores.`);
    }
    
    // Validate status configuration
    if (typeof statusConfig.active !== 'boolean') {
      throw new Error(`Status "${statusName}" must have a boolean "active" property`);
    }
    
    if (typeof statusConfig.includeInDigest !== 'boolean') {
      throw new Error(`Status "${statusName}" must have a boolean "includeInDigest" property`);
    }
    
    // Validate color format if provided
    if (statusConfig.color && !/^#[0-9A-Fa-f]{6}$/.test(statusConfig.color)) {
      throw new Error(`Status "${statusName}" has invalid color format. Must be hex format like #ff0000`);
    }
    
    // Validate allowTransitionTo if provided
    if (statusConfig.allowTransitionTo) {
      if (!Array.isArray(statusConfig.allowTransitionTo)) {
        throw new Error(`Status "${statusName}" allowTransitionTo must be an array`);
      }
      
      for (const targetStatus of statusConfig.allowTransitionTo) {
        if (typeof targetStatus !== 'string') {
          throw new Error(`Status "${statusName}" allowTransitionTo must contain only strings`);
        }
      }
    }
  }
  
  // Validate validation config
  if (config.validation) {
    if (config.validation.summaryLimit !== undefined && 
        (!Number.isInteger(config.validation.summaryLimit) || config.validation.summaryLimit < 1)) {
      throw new Error('summaryLimit must be a positive integer');
    }
    
    if (config.validation.strictWorkflow !== undefined && 
        typeof config.validation.strictWorkflow !== 'boolean') {
      throw new Error('strictWorkflow must be a boolean');
    }
    
    if (config.validation.requiredFields !== undefined) {
      if (!Array.isArray(config.validation.requiredFields)) {
        throw new Error('requiredFields must be an array');
      }
      
      for (const field of config.validation.requiredFields) {
        if (typeof field !== 'string') {
          throw new Error('requiredFields must contain only strings');
        }
      }
    }
  }
  
  // Validate workflow transitions if strict workflow is enabled
  if (config.validation?.strictWorkflow) {
    validateWorkflowTransitions(config.statuses);
  }
}

/**
 * Validate workflow transitions are possible
 */
function validateWorkflowTransitions(statuses: Record<string, StatusConfig>): void {
  const statusNames = Object.keys(statuses);
  
  for (const [statusName, statusConfig] of Object.entries(statuses)) {
    if (statusConfig.allowTransitionTo) {
      for (const targetStatus of statusConfig.allowTransitionTo) {
        if (!statusNames.includes(targetStatus)) {
          throw new Error(`Status "${statusName}" references unknown transition target "${targetStatus}"`);
        }
      }
    }
  }
}

/**
 * Get all active statuses from configuration
 */
export function getActiveStatuses(config: AdrConfig): Set<string> {
  return new Set(
    Object.entries(config.statuses)
      .filter(([, statusConfig]) => statusConfig.active)
      .map(([statusName]) => statusName.toLowerCase())
  );
}

/**
 * Get all statuses that should be included in digest
 */
export function getDigestStatuses(config: AdrConfig): Set<string> {
  return new Set(
    Object.entries(config.statuses)
      .filter(([, statusConfig]) => statusConfig.includeInDigest)
      .map(([statusName]) => statusName.toLowerCase())
  );
}

/**
 * Get all valid statuses from configuration (case-insensitive)
 */
export function getValidStatuses(config: AdrConfig): Set<string> {
  return new Set(
    Object.keys(config.statuses).map(status => status.toLowerCase())
  );
}

/**
 * Check if a status transition is allowed
 */
export function isTransitionAllowed(
  config: AdrConfig,
  fromStatus: string,
  toStatus: string
): boolean {
  // If strict workflow is disabled, allow any transition
  if (!config.validation?.strictWorkflow) {
    return true;
  }
  
  const fromStatusConfig = config.statuses[fromStatus.toLowerCase()];
  if (!fromStatusConfig) {
    return false;
  }
  
  // If no transitions defined, allow any transition
  if (!fromStatusConfig.allowTransitionTo) {
    return true;
  }
  
  return fromStatusConfig.allowTransitionTo
    .map(status => status.toLowerCase())
    .includes(toStatus.toLowerCase());
}