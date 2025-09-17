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
