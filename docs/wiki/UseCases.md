# Real-World Use Cases for @lordcraymen/adr-toolkit

This page collects concrete scenarios that show how teams, individual developers, and automation systems rely on `@lordcraymen/adr-toolkit`. Each example focuses on functionality that ships with the CLI and programmatic API today, so you can adapt the patterns directly in your own workflow.

## Persona: Atlassian-Centric Platform Team

**Goal:** Keep a Confluence knowledge base and Jira issues aligned with current architectural decisions while working in a mono-repo.

1. **Bootstrap predictable scaffolding** – Run `adrx init` when creating a new service repository. The command lays down the `docs/adr/` directory, copies the MADR-style template, installs `.dependency-cruiser.js`, and adds the shared PR template so every squad starts with identical documentation guardrails.
2. **Validate ADR submissions in Bitbucket Pipelines** – Add `npx adrx check` to the pipeline. The command enforces required frontmatter (title, status, summary) and the default status allow list, preventing incomplete ADRs from merging.
3. **Publish machine-readable digests for Confluence** – Execute `npx adrx build` after validation. The workflow consumes `docs/adr/index.json` to render a Confluence page macro and attaches `docs/adr/ACTIVE.md` to the knowledge base. Because the CLI updates these artifacts deterministically, the team can safely sync them via REST without manual formatting.
4. **Connect Jira issues to affected decisions** – In pull requests, `npx adrx affected --base main` highlights ADRs touched by code changes using `modules` and `tags` metadata. Engineers paste the reported ADR IDs into Jira tickets so stakeholders can jump directly to the relevant decision context.

## Persona: AI-First Lead Developer

**Goal:** Guide a coding agent to document decisions consistently while the human developer reviews and curates the output.

1. **Seed agent prompts with guardrails** – Running `adrx init` installs `docs/ADR_GUIDELINES.md`, a curated prompt template for AI assistants. The lead developer wires this file into the agent’s system prompt so every generated ADR follows the team’s voice and format.
2. **Generate ADRs from structured output** – After the agent proposes a change, the developer feeds its JSON response to `adrx create --json-stdin`. The command materializes a properly formatted Markdown ADR with Context, Decision, Consequences, and References sections without hand-editing markdown.
3. **Automated linting inside the agent loop** – The agent executes `adrx check` on the newly created ADR to confirm the summary length, status, and required fields before returning the patch for review. Any validation errors are surfaced back to the agent for correction.
4. **Programmatic post-processing** – When the agent needs richer metadata, the developer calls `createAdr()` from the Node API to inject custom dates or tags, then saves the result through the repo’s tooling. Because the helper mirrors the CLI behavior, the agent’s output stays aligned with manually authored ADRs.

## Persona: Compliance-Focused Governance Lead

**Goal:** Enforce organization-specific ADR states and audit trails across multiple codebases.

1. **Standardize status taxonomy** – The governance lead drops a shared `.adrx.config.json` in every repository and checks it into version control. Running `adrx config init` provides a starting template that they extend with company-approved statuses (e.g., `approved`, `sunset`) and summary length requirements.
2. **Verify configuration drift** – Scheduled jobs call `adrx config validate` to ensure no team committed an invalid configuration. Because validation runs locally and in CI, any drift is detected before compliance reviews.
3. **Curate accepted decisions for audit packs** – Nightly jobs execute `adrx build` and collect `dist/adr-digest.json`, which already filters accepted decisions. The file is archived alongside deployment evidence to satisfy audit traceability without bespoke scripts.

## Persona: Open Source Maintainer

**Goal:** Provide contributors with decision context and keep community pull requests aligned with the project’s architecture.

1. **Provide contributor onboarding** – `adrx init` copies `.github/PULL_REQUEST_TEMPLATE.md`, giving maintainers an immediate place to link ADR expectations and request references to relevant decisions.
2. **Surface ADR context in pull requests** – The maintainer wires `adrx pr-comment` into a GitHub Actions workflow. When a contributor opens a PR and repository secrets provide `GITHUB_TOKEN`, the action posts the rendered digest of accepted ADRs so reviewers can confirm alignment before approving.
3. **Expose ADR metadata to the docs site** – Using the exported `buildArtifacts()` helper in a docs-generation script, the maintainer emits the same JSON/Markdown artifacts the CLI produces. The static site generator consumes these files to render an ADR index page without duplicating logic.

---

Need another scenario or improvement? Open an issue describing your workflow so we can document it here.
