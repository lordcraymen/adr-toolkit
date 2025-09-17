import { createDigest, loadAdrs } from './adr.js';

export interface PrCommentResult {
  posted: boolean;
  reason?: string;
}

export async function runPrComment(cwd: string = process.cwd()): Promise<PrCommentResult> {
  const token = process.env.GITHUB_TOKEN;
  const repository = process.env.GITHUB_REPOSITORY;
  const prNumber = detectPrNumber(process.env);

  if (!token || !repository || !prNumber) {
    const reason = !token
      ? 'GITHUB_TOKEN missing, skipping comment.'
      : !repository
      ? 'GITHUB_REPOSITORY missing, skipping comment.'
      : 'Pull request context missing, skipping comment.';
    console.log(reason);
    return { posted: false, reason };
  }

  const adrs = await loadAdrs(cwd);
  const generatedAt = new Date().toISOString();
  const digest = createDigest(adrs, generatedAt);
  const body = renderDigestComment(digest);

  if (!body) {
    const reason = 'No accepted ADRs found, nothing to comment.';
    console.log(reason);
    return { posted: false, reason };
  }

  const endpoint = `https://api.github.com/repos/${repository}/issues/${prNumber}/comments`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/vnd.github+json'
    },
    body: JSON.stringify({ body })
  });

  if (!response.ok) {
    const reason = `GitHub API request failed with status ${response.status}.`;
    console.warn(reason);
    return { posted: false, reason };
  }

  console.log(`Posted ADR digest comment to PR #${prNumber}.`);
  return { posted: true };
}

function detectPrNumber(env: NodeJS.ProcessEnv): number | undefined {
  const ref = env.GITHUB_REF;
  if (ref) {
    const match = ref.match(/refs\/pull\/(\d+)/);
    if (match) {
      return Number.parseInt(match[1], 10);
    }
  }
  const eventNumber = env.PR_NUMBER ?? env.GITHUB_EVENT_NUMBER;
  if (eventNumber) {
    const parsed = Number.parseInt(eventNumber, 10);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }
  return undefined;
}

function renderDigestComment(digest: ReturnType<typeof createDigest>): string {
  if (digest.count === 0) {
    return '';
  }
  const rows = digest.adrs
    .map((adr) => `| ${adr.id} | ${adr.title} | ${escapePipes(truncate(adr.summary, 180))} |`)
    .join('\n');
  return [
    '## ADR Digest',
    '',
    `Generated at ${digest.generatedAt}`,
    '',
    '| ID | Title | Summary |',
    '| --- | --- | --- |',
    rows,
    '',
    '_(automated comment via adrx)_'
  ]
    .filter(Boolean)
    .join('\n');
}

function escapePipes(value: string): string {
  return value.replace(/\|/g, '\\|');
}

function truncate(value: string, max: number): string {
  if (value.length <= max) {
    return value;
  }
  return `${value.slice(0, max - 1)}…`;
}
