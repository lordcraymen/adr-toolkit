# @lordcraymen/adr-toolkit

A batteries-included CLI to bootstrap, lint, and publish Architecture Decision Records (ADRs). You can just install it in any repository to automate ADR workflows and ship documentation alongside your code.

## Installation

```bash
npm install --save-dev @lordcraymen/adr-toolkit
```

The package ships ESM builds and exposes the `adrx` executable via the `bin` field.

## CLI usage

Run `npx adrx --help` to inspect the full help output.

### `adrx init`

Idempotently scaffolds ADR directories and helper templates:

- `docs/adr/` with a README and template copy (`docs/adr/templates/ADR-0000-template.md`).
- `docs/ADR_GUIDELINES.md` with AI assistant guidelines (prompts for overwrite if modified).
- `.dependency-cruiser.js` wired to the provided dependency-cruiser preset.
- `.github/PULL_REQUEST_TEMPLATE.md` for contributor guidance.

### `adrx build`

Parses ADR Markdown files and emits machine-readable artifacts:

- `docs/adr/index.json` – metadata for every ADR (status, tags, summary, etc.).
- `docs/adr/ACTIVE.md` – Markdown table with currently active ADRs.
- `dist/adr-digest.json` – digest of accepted ADRs for use in CI or PR summaries.

### `adrx check`

Validates ADR frontmatter:

- Ensures `title`, `status`, and `summary` are present.
- Validates against a configurable set of allowed statuses (default: accepted, approved, proposed, draft, rejected, deprecated, superseded).
- Enforces a 300-character summary limit.
- Uses `.adrx.config.json` configuration if available for custom validation rules.

### `adrx affected --base <ref>`

Diffs the working tree against a git reference and reports ADRs affected by the change. ADRs are marked as affected when:

- The ADR file itself changed.
- A changed file matches one of the ADR `modules` entries (prefix match).
- A changed path contains one of the ADR `tags` strings.

### `adrx create`

Create new ADRs programmatically from structured input:

**CLI Options:**
```bash
# Create with individual options
adrx create --title "Use TypeScript" --summary "We will use TypeScript for better type safety" --status "proposed"

# Include tags and modules
adrx create --title "Adopt GraphQL" --summary "GraphQL provides better API flexibility" --tags "api,graphql" --modules "src/api/"

# Create from JSON input
adrx create --json '{"title": "Use React", "summary": "React for frontend", "status": "accepted", "tags": ["frontend", "ui"]}'

# Read JSON from stdin
echo '{"title": "Migration Plan", "summary": "Database migration strategy"}' | adrx create --json-stdin
```

**Required fields:** `title` and `summary`  
**Optional fields:** `status` (default: "Proposed"), `tags`, `modules`, `date`, custom content for Context, Decision, Consequences, and References sections.

This command enables coding agents and automation tools to create ADRs without manual markdown formatting, addressing the structured interface need mentioned in issue #34.

### `adrx pr-comment`

Posts the accepted ADR digest as a pull request comment when `GITHUB_TOKEN`, `GITHUB_REPOSITORY`, and PR metadata are available (e.g., within GitHub Actions). Without the necessary secrets, it logs a short message and exits without failing the build.

### `adrx config`

Manage ADR configuration through the `.adrx.config.json` file:

- `adrx config init` – Initialize a default configuration file with customizable status values and other settings.
- `adrx config validate` – Validate the current configuration file against the schema.
- `adrx config show` – Display the current effective configuration.

The configuration file allows you to customize allowed ADR statuses, validation rules, and output formats.

## Presets and templates

- `presets/depcruise.cjs` – dependency-cruiser layering rules to keep UI, application, and domain code separated.
- `presets/eslint-boundaries.cjs` – minimal ESLint preset using the `eslint-plugin-boundaries` conventions.
- `templates/adr/ADR-0000-template.md` – MADR-inspired ADR template with YAML frontmatter.
- `templates/ADR_GUIDELINES.md` – AI assistant guidelines template for working with ADRs.
- `templates/adrx.config.json` – default configuration template with customizable settings.
- `templates/.dependency-cruiser.js`, `templates/PULL_REQUEST_TEMPLATE.md` – helper scaffolding applied during `adrx init`.

Import the presets from Node using the exposed export paths:

``` js
import depcruise from '@lordcraymen/adr-toolkit/presets/depcruise.cjs';
```

## API

The toolkit also exposes programmatic helpers:

- `loadAdrs()` – parse ADR Markdown into structured objects.
- `validateAdrs()` and `validateAdrsWithConfig()` – return an array of validation errors, with optional custom configuration.
- `createAdr()` – programmatically create new ADRs from structured input.
- `createDigest()`, `createDigestWithConfig()` and `buildArtifacts()`, `buildArtifactsWithConfig()` – generate JSON/Markdown digests for custom pipelines, with optional configuration support.
- `runAffected()`, `runCheck()`, `runBuild()`, `runBuildWithConfig()`, `runPrComment()` – the same routines invoked by the CLI.
- Configuration helpers: `loadConfig()`, `validateConfig()` – load and validate `.adrx.config.json` files.

Each helper accepts an optional working directory argument so you can run the tooling from scripts or tests. The `*WithConfig` variants allow you to pass custom configuration objects for advanced use cases.

### TypeScript Types

All key TypeScript types are exported from the main entry point for downstream tool integration:

```typescript
import type {
  AdrIndex,
  AdrDigest,
  AdrDocument,
  AdrFrontmatter,
  CheckResult,
  BuildResult,
  AffectedResult,
  ValidationError,
  OutputFormat
} from '@lordcraymen/adr-toolkit';
```

These types enable auto-completion and validation in TypeScript projects that consume ADR artifacts or integrate with the toolkit's API.

## Continuous Integration

A reusable GitHub Actions workflow lives at `.github/workflows/ci.yml`. It runs on Node.js 18, 20, and 22 using `npm ci` followed by `lint`, `typecheck`, `test`, and `build`.

## Acknowledgments

This tool supports the Architectural Decision Records pattern 
as described by Michael Nygard in his influential blog post:
"Documenting Architecture Decisions"

For more information about ADRs and related tooling, see:
- [ADR GitHub Organization](https://adr.github.io/)
- [Architecture Decision Records](https://adr.github.io/)

## License

MIT © Florian "lordcraymen" Patzke

