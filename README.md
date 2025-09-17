# @lordcraymen/adr-toolkit

A batteries-included CLI to bootstrap, lint, and publish Architecture Decision Records (ADRs). You can just install it in any repository to automate ADR workflows and ship documentation alongside your code.

## Installation

```bash
npm install --save-dev @lordcraymen/adr-toolkit
```

The package ships ESM builds and exposes the `adrx` executable via the `bin` field. It also registers a `prepare` hook so the bundled CLI is ready after install.

## CLI usage

Run `npx adrx --help` to inspect the full help output.

### `adrx init`

Idempotently scaffolds ADR directories and helper templates:

- `docs/adr/` with a README and template copy (`docs/adr/templates/ADR-0000-template.md`).
- `.dependency-cruiser.js` wired to the provided dependency-cruiser preset.
- `.github/PULL_REQUEST_TEMPLATE.md` and `AGENT_RULES-snippet.md` for contributor guidance.

### `adrx build`

Parses ADR Markdown files and emits machine-readable artifacts:

- `docs/adr/index.json` – metadata for every ADR (status, tags, summary, etc.).
- `docs/adr/ACTIVE.md` – Markdown table with currently active ADRs.
- `dist/adr-digest.json` – digest of accepted ADRs for use in CI or PR summaries.

### `adrx check`

Validates ADR frontmatter:

- Ensures `title`, `status`, and `summary` are present.
- Accepts a configurable set of statuses (Accepted, Proposed, Draft, Rejected, Deprecated, Superseded).
- Enforces a 300-character summary limit.

### `adrx affected --base <ref>`

Diffs the working tree against a git reference and reports ADRs affected by the change. ADRs are marked as affected when:

- The ADR file itself changed.
- A changed file matches one of the ADR `modules` entries (prefix match).
- A changed path contains one of the ADR `tags` strings.

### `adrx pr-comment`

Posts the accepted ADR digest as a pull request comment when `GITHUB_TOKEN`, `GITHUB_REPOSITORY`, and PR metadata are available (e.g., within GitHub Actions). Without the necessary secrets, it logs a short message and exits without failing the build.

## Presets and templates

- `presets/depcruise.cjs` – dependency-cruiser layering rules to keep UI, application, and domain code separated.
- `presets/eslint-boundaries.cjs` – minimal ESLint preset using the `eslint-plugin-boundaries` conventions.
- `templates/adr/ADR-0000-template.md` – MADR-inspired ADR template with YAML frontmatter.
- `templates/.dependency-cruiser.js`, `templates/PULL_REQUEST_TEMPLATE.md`, `templates/AGENT_RULES-snippet.md` – helper scaffolding applied during `adrx init`.

Import the presets from Node using the exposed export paths:

``` js
import depcruise from '@lordcraymen/adr-toolkit/presets/depcruise.cjs';
```

## API

The toolkit also exposes programmatic helpers:

- `loadAdrs()` – parse ADR Markdown into structured objects.
- `validateAdrs()` – return an array of validation errors.
- `createDigest()` and `buildArtifacts()` – generate JSON/Markdown digests for custom pipelines.
- `runAffected()`, `runCheck()`, `runBuild()`, `runPrComment()` – the same routines invoked by the CLI.

Each helper accepts an optional working directory argument so you can run the tooling from scripts or tests.

## Continuous Integration

A reusable GitHub Actions workflow lives at `.github/workflows/ci.yml`. It runs on Node.js 18, 20, and 22 using `npm ci` followed by `lint`, `typecheck`, `test`, and `build`.

## License

MIT © Florian "lordcraymen" Patzke
