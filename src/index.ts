// Core functionality exports
export * from './adr.js';
export * from './create.js';
export * from './init.js';
export * from './build.js';
export * from './check.js';
export * from './affected.js';
export * from './pr-comment.js';
export * from './config.js';
export * from './config-cli.js';
export * from './types.js';

// Explicit exports for key public API types to improve discoverability
export type {
  AdrIndex,
  AdrDigest,
  AdrIndexEntry,
  AdrDigestEntry
} from './adr.js';

export type {
  AdrDocument,
  AdrFrontmatter,
  CheckResult,
  BuildResult,
  AffectedResult,
  ValidationError,
  OutputFormat
} from './types.js';
