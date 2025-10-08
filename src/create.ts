import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { ADR_DIRECTORY } from './constants.js';
import { pathExists, ensureDir } from './fs-utils.js';
import { loadAdrs } from './adr.js';
import { loadConfig } from './config.js';
import type { AdrFrontmatter } from './types.js';

export interface CreateAdrInput {
  title: string;
  summary: string;
  status?: string;
  tags?: string[];
  modules?: string[];
  date?: string;
  context?: string;
  decision?: string;
  consequences?: string;
  references?: string;
}

export interface CreateAdrResult {
  id: string;
  path: string;
  created: boolean;
}

/**
 * Generate the next available ADR ID by checking existing ADRs
 */
async function generateNextAdrId(cwd: string): Promise<string> {
  try {
    const existingAdrs = await loadAdrs(cwd);
    const adrNumbers = existingAdrs
      .map(adr => adr.id.match(/ADR-(\d+)/)?.[1])
      .filter(Boolean)
      .map(Number)
      .filter(n => !isNaN(n));
    
    const nextNumber = adrNumbers.length > 0 ? Math.max(...adrNumbers) + 1 : 1;
    return `ADR-${nextNumber.toString().padStart(4, '0')}`;
  } catch {
    // If no ADRs exist or there's an error, start with ADR-0001
    return 'ADR-0001';
  }
}

/**
 * Generate ADR filename from title
 */
function generateFilename(id: string, title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .substring(0, 50); // Keep it reasonable
  
  return `${id}-${slug}.md`;
}

/**
 * Generate ADR markdown content from input
 */
function generateAdrContent(input: CreateAdrInput, id: string): string {
  const frontmatter: AdrFrontmatter = {
    title: `${id}: ${input.title}`,
    date: input.date || new Date().toISOString().split('T')[0],
    status: input.status || 'Proposed',
    summary: input.summary
  };

  if (input.tags && input.tags.length > 0) {
    frontmatter.tags = input.tags;
  }

  if (input.modules && input.modules.length > 0) {
    frontmatter.modules = input.modules;
  }

  // Generate YAML frontmatter
  const yamlLines = ['---'];
  yamlLines.push(`title: "${frontmatter.title}"`);
  yamlLines.push(`date: "${frontmatter.date}"`);
  yamlLines.push(`status: ${frontmatter.status}`);
  
  if (frontmatter.tags) {
    yamlLines.push('tags:');
    const tags = Array.isArray(frontmatter.tags) ? frontmatter.tags : [frontmatter.tags];
    tags.forEach((tag: string) => yamlLines.push(`  - ${tag}`));
  }
  
  if (frontmatter.modules) {
    yamlLines.push('modules:');
    const modules = Array.isArray(frontmatter.modules) ? frontmatter.modules : [frontmatter.modules];
    modules.forEach((module: string) => yamlLines.push(`  - ${module}`));
  }
  
  yamlLines.push(`summary: >-`);
  yamlLines.push(`  ${frontmatter.summary}`);
  yamlLines.push('---');

  // Generate markdown body
  const bodyLines = [
    '',
    `# Context`,
    '',
    input.context || 'Describe the forces at play, relevant background and constraints.',
    '',
    `# Decision`,
    '',
    input.decision || 'State the decision that was made.',
    '',
    `# Consequences`,
    '',
    input.consequences || 'Explain the positive and negative outcomes from this decision.',
    '',
    `# References`,
    '',
    input.references || '- Link to related ADRs or documentation.',
    ''
  ];

  return yamlLines.join('\n') + bodyLines.join('\n');
}

/**
 * Validate ADR input against configuration
 */
async function validateCreateInput(input: CreateAdrInput, cwd: string): Promise<string[]> {
  const errors: string[] = [];
  
  // Required fields validation
  if (!input.title || input.title.trim() === '') {
    errors.push('Title is required');
  }
  
  if (!input.summary || input.summary.trim() === '') {
    errors.push('Summary is required');
  }

  // Load config and validate against it
  try {
    const config = await loadConfig(cwd);
    
    // Validate summary length
    const summaryLimit = config.validation?.summaryLimit || 300;
    if (input.summary && input.summary.length > summaryLimit) {
      errors.push(`Summary exceeds maximum length of ${summaryLimit} characters`);
    }
    
    // Validate status
    if (input.status) {
      const allowedStatuses = Object.keys(config.statuses);
      if (!allowedStatuses.includes(input.status.toLowerCase())) {
        errors.push(`Invalid status "${input.status}". Allowed statuses: ${allowedStatuses.join(', ')}`);
      }
    }
  } catch {
    // If config can't be loaded, use basic validation
    if (input.summary && input.summary.length > 300) {
      errors.push('Summary exceeds maximum length of 300 characters');
    }
  }

  return errors;
}

/**
 * Create a new ADR from input
 */
export async function createAdr(input: CreateAdrInput, cwd: string = process.cwd()): Promise<CreateAdrResult> {
  // Validate input
  const errors = await validateCreateInput(input, cwd);
  if (errors.length > 0) {
    throw new Error(`Validation failed: ${errors.join(', ')}`);
  }

  // Ensure ADR directory exists
  const adrDir = path.join(cwd, ADR_DIRECTORY);
  await ensureDir(adrDir);

  // Generate ID and filename
  const id = await generateNextAdrId(cwd);
  const filename = generateFilename(id, input.title);
  const filePath = path.join(adrDir, filename);

  // Check if file already exists
  if (await pathExists(filePath)) {
    throw new Error(`ADR file already exists: ${filename}`);
  }

  // Generate content and write file
  const content = generateAdrContent(input, id);
  await writeFile(filePath, content, 'utf8');

  return {
    id,
    path: path.relative(cwd, filePath),
    created: true
  };
}

/**
 * Parse JSON input for ADR creation
 */
export function parseJsonInput(jsonInput: string): CreateAdrInput {
  try {
    const parsed = JSON.parse(jsonInput);
    
    if (typeof parsed !== 'object' || parsed === null) {
      throw new Error('JSON input must be an object');
    }

    return {
      title: String(parsed.title || ''),
      summary: String(parsed.summary || ''),
      status: parsed.status != null ? String(parsed.status) : undefined,
      tags: Array.isArray(parsed.tags) ? parsed.tags.map(String) : undefined,
      modules: Array.isArray(parsed.modules) ? parsed.modules.map(String) : undefined,
      date: parsed.date != null ? String(parsed.date) : undefined,
      context: parsed.context != null ? String(parsed.context) : undefined,
      decision: parsed.decision != null ? String(parsed.decision) : undefined,
      consequences: parsed.consequences != null ? String(parsed.consequences) : undefined,
      references: parsed.references != null ? String(parsed.references) : undefined
    };
  } catch (error) {
    throw new Error(`Invalid JSON input: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Parse CLI options into CreateAdrInput
 */
export function parseCliInput(options: {
  title?: string;
  summary?: string;
  status?: string;
  tags?: string;
  modules?: string;
  date?: string;
  context?: string;
  decision?: string;
  consequences?: string;
  references?: string;
}): CreateAdrInput {
  return {
    title: options.title || '',
    summary: options.summary || '',
    status: options.status,
    tags: options.tags ? options.tags.split(',').map(s => s.trim()) : undefined,
    modules: options.modules ? options.modules.split(',').map(s => s.trim()) : undefined,
    date: options.date,
    context: options.context,
    decision: options.decision,
    consequences: options.consequences,
    references: options.references
  };
}