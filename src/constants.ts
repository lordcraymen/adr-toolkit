export const ADR_DIRECTORY = 'docs/adr';
export const ADR_GLOB = `${ADR_DIRECTORY}/**/*.md`;
export const ADR_TEMPLATE_NAME = 'ADR-0000-template.md';
export const DIGEST_PATH = 'dist/adr-digest.json';
export const ACTIVE_PATH = `${ADR_DIRECTORY}/ACTIVE.md`;
export const INDEX_PATH = `${ADR_DIRECTORY}/index.json`;
export const SUMMARY_LIMIT = 300;

export const CLOSED_STATUSES = new Set(['rejected', 'superseded', 'deprecated']);
export const ACCEPTED_STATUSES = new Set(['accepted', 'approved']);
