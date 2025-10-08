# Developer Experience & Energy Efficiency Improvement Backlog

The following backlog items translate the repository review into actionable GitHub issues. Each issue proposal targets a concrete developer-experience pain point while reducing unnecessary compute usage (energy) across local development and the CI/CD pipeline. Every item contains a user value statement, rationale, and initial acceptance criteria to make the issues immediately actionable.

---

## Issue 1: Add Test Targeting & Persistent Vitest Cache to Reduce Redundant Runs

- **Type:** `enhancement`
- **User Story:** As a contributor, I want the test runner to execute only the suites affected by my changes so that local feedback loops and CI pipelines finish faster and consume less energy.
- **Context:** `package.json` maps all test scripts to `vitest run`, which always executes the entire suite—even for documentation-only changes.【F:package.json†L22-L35】 Vitest supports both a filesystem cache and `--changed`/`--related` filters to skip unaffected suites, but this project currently leaves these optimisations unused.
- **Proposal:**
  1. Enable Vitest's persistent cache (`cache: { dir: '.vitest-cache' }`) and store it between CI jobs to avoid recompiling unchanged test modules.
  2. Add an npm script (e.g., `test:changed`) that calls `vitest --changed --run` and document it in `docs/TESTING_GUIDE.md` so contributors can run only the suites touched by staged files.
  3. Teach the CI workflow to fall back to `vitest run` only when no cache is available (e.g., first run or cache bust).
- **Acceptance Criteria:**
  - New script and documentation exist.
  - CI configuration detects the cache and executes the targeted command when possible.
  - Developer guide highlights when to use the targeted test script vs. the full run.

---

## Issue 2: Stage-aware Build Pipeline with `tsup --watch` Profiles

- **Type:** `enhancement`
- **User Story:** As a maintainer, I want local development builds to recompile only affected files and reuse previous build results so that iterative work burns fewer CPU cycles.
- **Context:** The default `build` script delegates to plain `tsup`, which recompiles everything on each invocation.【F:package.json†L16-L21】 Tsup can persist incremental state (`--watch --incremental`) and emit type declarations selectively, but there is no `dev` profile using those features.
- **Proposal:**
  1. Introduce a `build:dev` npm script that runs `tsup --watch --incremental --sourcemap --dts` to enable incremental bundling during active development.
  2. Document when to use the incremental build vs. the production build in `docs/TESTING_GUIDE.md` or a new contributor guide.
  3. (Optional) Cache the `tsup` output directory in CI so repeated releases do not rebuild unchanged artefacts unless the source hash changes.
- **Acceptance Criteria:**
  - Additional script exists and is described in documentation.
  - Local developer workflow demonstrates reduced rebuild times (e.g., instructions to profile with `time npm run build` before/after).
  - CI pipelines leverage caching where supported by the platform.

---

## Issue 3: Automate Gherkin Feature Execution to Eliminate Manual Sync Drift

- **Type:** `tests`
- **User Story:** As a QA champion, I need the existing BDD feature files to run automatically so that behaviour specifications stay in sync with the implementation without manual verification work.
- **Context:** `docs/TESTING_GUIDE.md` showcases seven Gherkin feature files and hints at future Cucumber integration, but no automation is wired up yet.【F:docs/TESTING_GUIDE.md†L44-L71】【F:docs/TESTING_GUIDE.md†L96-L113】 This gap forces humans to interpret scenarios manually, inviting regressions and repeated test reruns downstream.
- **Proposal:**
  1. Create step definitions using `@cucumber/cucumber` (already listed in `devDependencies`) and execute them via a new npm script (e.g., `bdd:test`).
  2. Map scenarios to existing Vitest helpers to avoid duplicating expensive setup logic.
  3. Run the Cucumber suite only when `.feature` files or their step definitions change, minimising CI energy consumption via path filters.
- **Acceptance Criteria:**
  - Automated Cucumber workflow running locally and in CI.
  - Documentation updated with instructions for writing and executing scenarios.
  - CI optimisation ensures the BDD job is skipped for unrelated changes.

---

## Issue 4: Document Git Commit Hooks & Local Lint/Test Expectations

- **Type:** `documentation`
- **User Story:** As a new contributor, I want clarity on which commands must run before committing so that I avoid unnecessary CI reruns caused by failed lint or type checks.
- **Context:** Husky is configured via the `prepare` script, but the repository lacks a contributor-facing summary that explains the local quality gates, leading to avoidable CI failures and reruns.【F:package.json†L36-L49】
- **Proposal:**
  1. Extend `docs/TESTING_GUIDE.md` (or add `docs/CONTRIBUTING.md`) with a "Local Quality Checklist" covering linting, type checking, targeted tests, and formatting expectations.
  2. Cross-link from the README onboarding section so UX-focused contributors know which commands conserve CI cycles.
  3. Optionally, publish a lightweight `npm run verify` wrapper that chains linting, type check, and targeted tests with friendly output.
- **Acceptance Criteria:**
  - Documentation clearly lists pre-commit checks and their purpose.
  - README references the checklist for quick discovery.
  - (Optional) Wrapper script exists and surfaces aggregated success/failure output.

---

## Issue 5: Measure & Report Test Runtime to Detect Regressions

- **Type:** `tests`
- **User Story:** As an engineering lead, I need visibility into test runtime trends to catch regressions that would otherwise silently increase energy consumption in CI.
- **Context:** The current Vitest configuration and documentation emphasise coverage and breadth but do not capture or report timing data for suites.【F:docs/TESTING_GUIDE.md†L1-L90】 Without timing telemetry, long-running tests can creep in unnoticed, causing repeated reruns and power waste.
- **Proposal:**
  1. Enable Vitest's `--reporter=json` (or tap) to collect per-suite duration metrics and publish them as CI artifacts.
  2. Add a lightweight script that parses the report and highlights suites exceeding a configurable threshold, prompting targeted optimisation instead of brute-force reruns.
  3. Document how to interpret the report and tie it into energy-aware development guidelines.
- **Acceptance Criteria:**
  - CI job uploads runtime reports and surfaces warnings for slow suites.
  - Documentation explains how contributors can run the same tooling locally.
  - Thresholds and remediation steps are agreed upon and versioned in the repo.

