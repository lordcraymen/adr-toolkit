# ADR Toolkit Repository Inspection

## Inconsistencies and Quality Gaps
- The README advertises a `prepare` hook that prebuilds the CLI after install, but the `package.json` scripts do not define `prepare`, so consumers will not actually get that behaviour. Align the docs or restore the hook to avoid confusing onboarding steps.【F:README.md†L11-L24】【F:package.json†L20-L32】
- The README claims the validator "accepts a configurable set of statuses", yet `validateAdrs` enforces a hard-coded allow-list at runtime. Either expose configuration or clarify the limitation to keep expectations realistic.【F:README.md†L33-L39】【F:src/adr.ts†L135-L148】
- Repository guardrails mandate "comprehensive BDD scenarios in German", but the feature files under `tests/features/` are written in English. Translating or dual-authoring the scenarios would bring tests back in line with the published standards.【F:AGENT_RULES.md†L1-L12】【F:tests/features/adr-affected.feature†L1-L85】
- Several feature files end without a trailing newline (e.g., `adr-affected.feature`), which makes diffs noisier and can break tooling that expects POSIX-compliant text files. Adding newlines improves consistency.【F:tests/features/adr-affected.feature†L1-L85】
- The devDependency on `@lordcraymen/adr-toolkit` points back to the package itself, which risks circular installs in local development. Confirm whether the self-reference is intentional; otherwise, remove it to avoid confusing package managers.【F:package.json†L57-L74】

## Security Observations
- `runPrComment` posts directly to the GitHub API without a timeout or retry strategy. A slow or unreachable network could hang CI pipelines indefinitely. Wrapping the fetch in an `AbortController` with a sensible timeout (and optional retry/backoff) would make the command more robust under adverse network conditions.【F:src/pr-comment.ts†L8-L53】
- The GitHub request also omits an explicit `User-Agent` header, which GitHub recommends for API traffic. Adding a descriptive agent string (for example `@lordcraymen/adr-toolkit/${version}`) makes the call compliant and easier to trace.【F:src/pr-comment.ts†L34-L43】
- Because the project relies on the global `fetch` implementation, running the CLI on Node.js versions prior to 18 will throw at runtime. Declare the minimum supported Node version in `package.json` (via `engines`) or ship a ponyfill to avoid inadvertent execution in unsupported environments.【F:package.json†L1-L75】【F:src/pr-comment.ts†L34-L43】

## Ideas to Help Coding Agents
- Provide structured output modes (e.g., `adrx check --format json`) so agents can parse validation results without scraping human-oriented strings. Similar flags for `build` and `affected` would let orchestration frameworks consume the data programmatically.【F:src/check.ts†L1-L14】【F:src/affected.ts†L20-L49】
- Offer a `--plan` or `--dry-run` option for `adrx init` that prints the files it would create. Agents could reason about side effects before mutating a repository, aligning with cautious automation practices.【F:src/init.ts†L13-L47】
- Surface TypeScript types for the emitted artifacts (e.g., export `AdrIndex` and `AdrDigest` from the entry point) so downstream tools can auto-complete and validate integrations without digging into internal modules.【F:src/adr.ts†L19-L116】
- Publish JSON schemas for `docs/adr/index.json` and `dist/adr-digest.json` to help agents validate generated data or build adapters without reverse-engineering the structure.【F:src/adr.ts†L153-L205】

## Potential Action Hooks and Integrations
- Introduce lifecycle hooks (such as `beforeBuild`, `afterBuild`, `afterCheck`) that accept paths to shell scripts or Node modules. Agents could register custom automation—like syncing ADR digests to knowledge bases—without forking the CLI.【F:src/build.ts†L1-L7】【F:src/check.ts†L1-L14】
- Emit an event or write a summary file after `adrx affected` runs so other tools can trigger follow-up actions (e.g., tagging issues or notifying reviewers) when specific ADRs change.【F:src/affected.ts†L20-L49】
- Allow `adrx pr-comment` to run in a "render-only" mode that outputs the comment Markdown locally. Agents could then hand the content to other communication channels or custom bots instead of calling GitHub directly.【F:src/pr-comment.ts†L8-L103】
- Define a `postInit` hook so repositories can automatically extend the scaffold (for example, adding ADR linters or syncing templates) immediately after `adrx init` completes.【F:src/init.ts†L13-L47】
