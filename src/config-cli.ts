import { writeFile, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathExists } from './fs-utils.js';
import { loadConfig, validateConfig, AdrConfig } from './config.js';

/**
 * Initialize default configuration file
 */
export async function initConfig(cwd: string = process.cwd()): Promise<{ created: boolean; path: string }> {
  const configPath = join(cwd, '.adrx.config.json');
  
  if (await pathExists(configPath)) {
    return { created: false, path: configPath };
  }
  
  const defaultConfig: AdrConfig = {
    statuses: {
      'draft': {
        active: true,
        includeInDigest: false,
        description: 'Initial draft of architectural decision'
      },
      'proposed': {
        active: true,
        includeInDigest: false,
        description: 'Decision proposed and awaiting review'
      },
      'accepted': {
        active: true,
        includeInDigest: true,
        description: 'Decision has been accepted and approved'
      },
      'approved': {
        active: true,
        includeInDigest: true,
        description: 'Decision has been approved for implementation'
      },
      'rejected': {
        active: false,
        includeInDigest: false,
        description: 'Decision was rejected and will not be implemented'
      },
      'superseded': {
        active: false,
        includeInDigest: false,
        description: 'Decision was replaced by a newer decision'
      },
      'deprecated': {
        active: false,
        includeInDigest: false,
        description: 'Decision is deprecated but may still be in use'
      }
    },
    validation: {
      summaryLimit: 300,
      strictWorkflow: false,
      requiredFields: ['title', 'status', 'summary']
    }
  };
  
  await writeFile(configPath, JSON.stringify(defaultConfig, null, 2) + '\n');
  return { created: true, path: configPath };
}

/**
 * Validate configuration file
 */
export async function validateConfigFile(cwd: string = process.cwd()): Promise<{ valid: boolean; errors?: string[] }> {
  try {
    const config = await loadConfig(cwd);
    validateConfig(config);
    return { valid: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { valid: false, errors: [message] };
  }
}

/**
 * Show current effective configuration
 */
export async function showConfig(cwd: string = process.cwd()): Promise<AdrConfig> {
  return await loadConfig(cwd);
}

/**
 * Add a new status to configuration
 */
export async function addStatus(
  statusName: string,
  options: {
    active?: boolean;
    includeInDigest?: boolean;
    description?: string;
    color?: string;
    requiresApproval?: boolean;
  },
  cwd: string = process.cwd()
): Promise<void> {
  const configPath = join(cwd, '.adrx.config.json');
  
  // Load existing config or create new one
  let config: AdrConfig;
  if (await pathExists(configPath)) {
    const configContent = await readFile(configPath, 'utf8');
    config = JSON.parse(configContent);
  } else {
    const { created } = await initConfig(cwd);
    if (created) {
      config = await loadConfig(cwd);
    } else {
      throw new Error('Failed to create configuration file');
    }
  }
  
  // Add new status
  config.statuses[statusName] = {
    active: options.active ?? true,
    includeInDigest: options.includeInDigest ?? false,
    ...(options.description && { description: options.description }),
    ...(options.color && { color: options.color }),
    ...(options.requiresApproval && { requiresApproval: options.requiresApproval })
  };
  
  // Validate updated config
  validateConfig(config);
  
  // Save updated config
  await writeFile(configPath, JSON.stringify(config, null, 2) + '\n');
}

/**
 * CLI command implementations
 */
export async function runConfigInit(cwd: string = process.cwd()): Promise<void> {
  const { created, path } = await initConfig(cwd);
  
  if (created) {
    console.log(`✓ Created default configuration: ${path}`);
    console.log('📝 Edit this file to customize your ADR status workflow.');
  } else {
    console.log(`📋 Configuration already exists: ${path}`);
    console.log('💡 Use "adrx config show" to view current configuration.');
  }
}

export async function runConfigValidate(cwd: string = process.cwd()): Promise<void> {
  console.log('🔍 Validating ADR configuration...');
  
  const { valid, errors } = await validateConfigFile(cwd);
  
  if (valid) {
    console.log('✓ Configuration is valid.');
  } else {
    console.error('✖ Configuration validation failed:');
    if (errors) {
      for (const error of errors) {
        console.error(`  • ${error}`);
      }
    }
    process.exitCode = 1;
  }
}

export async function runConfigShow(cwd: string = process.cwd()): Promise<void> {
  try {
    const config = await showConfig(cwd);
    console.log('📋 Current ADR Configuration:');
    console.log('');
    console.log(JSON.stringify(config, null, 2));
    
    // Show status summary
    const statusCount = Object.keys(config.statuses).length;
    const activeCount = Object.values(config.statuses).filter(s => s.active).length;
    const digestCount = Object.values(config.statuses).filter(s => s.includeInDigest).length;
    
    console.log('');
    console.log(`📊 Status Summary: ${statusCount} total, ${activeCount} active, ${digestCount} in digest`);
  } catch (error) {
    console.error('✖ Failed to load configuration:');
    console.error(`  ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  }
}