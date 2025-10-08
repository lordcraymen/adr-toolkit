export interface AdrFrontmatter {
  id?: string;
  title?: string;
  status?: string;
  date?: string;
  tags?: string[] | string;
  modules?: string[] | string;
  summary?: string;
  [key: string]: unknown;
}

export interface AdrDocument {
  id: string;
  title: string;
  status: string;
  summary: string;
  date?: string;
  tags: string[];
  modules: string[];
  path: string;
  relativePath: string;
  body: string;
}

export interface ValidationError {
  file: string;
  message: string;
}

// Output format types for structured CLI responses
export type OutputFormat = 'json' | 'text';

export interface CheckResult {
  ok: boolean;
  adrCount: number;
  errors?: ValidationError[];
}

export interface BuildResult {
  ok: boolean;
  adrCount: number;
  artifactsGenerated: string[];
  error?: string;
}

export interface AffectedResult {
  changed: string[];
  affected: string[];
}
