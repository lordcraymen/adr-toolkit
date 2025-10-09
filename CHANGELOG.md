# [3.4.0](https://github.com/lordcraymen/adr-toolkit/compare/v3.3.2...v3.4.0) (2025-10-09)


### Features

* add explicit type exports for improved discoverability ([59d7172](https://github.com/lordcraymen/adr-toolkit/commit/59d71725181ee0d15d0630a165efa2271958d1d0)), closes [#18](https://github.com/lordcraymen/adr-toolkit/issues/18)
* export types module from main entry point ([75d144c](https://github.com/lordcraymen/adr-toolkit/commit/75d144cdda141828ce39d3192e78792c29117dad)), closes [#18](https://github.com/lordcraymen/adr-toolkit/issues/18)

## [3.3.2](https://github.com/lordcraymen/adr-toolkit/compare/v3.3.1...v3.3.2) (2025-10-08)


### Bug Fixes

* update package version to 3.3.1 in package.json and package-lock.json ([5fcb51e](https://github.com/lordcraymen/adr-toolkit/commit/5fcb51ea80f092f05d0e3b6ec18229f00d0a590f))

## [3.3.1](https://github.com/lordcraymen/adr-toolkit/compare/v3.3.0...v3.3.1) (2025-10-08)


### Bug Fixes

* remove unused import in create.ts ([5ac8543](https://github.com/lordcraymen/adr-toolkit/commit/5ac8543f8c442bdeb6d021c61a5017b1fcaf50ad))

# [3.3.0](https://github.com/lordcraymen/adr-toolkit/compare/v3.2.0...v3.3.0) (2025-10-08)


### Features

* add structured output modes for agent integration (resolves [#16](https://github.com/lordcraymen/adr-toolkit/issues/16)) ([2f678cd](https://github.com/lordcraymen/adr-toolkit/commit/2f678cd52bab8e5f33496ba7ecfbb5083d0740fa))

# [3.2.0](https://github.com/lordcraymen/adr-toolkit/compare/v3.1.2...v3.2.0) (2025-10-08)


### Bug Fixes

* update package versions to 3.1.2 in package.json and package-lock.json ([2f01824](https://github.com/lordcraymen/adr-toolkit/commit/2f01824ec4da89c35b1859cc597c9611361326d8))


### Features

* add --dry-run option for adrx init command ([4b8da8a](https://github.com/lordcraymen/adr-toolkit/commit/4b8da8a4252431f6303c50e451966473eaff8d38)), closes [#17](https://github.com/lordcraymen/adr-toolkit/issues/17)

## [3.1.2](https://github.com/lordcraymen/adr-toolkit/compare/v3.1.1...v3.1.2) (2025-10-08)


### Bug Fixes

* add unit and integration tests to pre-commit checks ([4f97024](https://github.com/lordcraymen/adr-toolkit/commit/4f97024601e4b586ba87bf1b92243f8a68c13d77))

## [3.1.1](https://github.com/lordcraymen/adr-toolkit/compare/v3.1.0...v3.1.1) (2025-10-08)


### Bug Fixes

* normalize file paths to use forward slashes in initWorkspace function ([6e6bc02](https://github.com/lordcraymen/adr-toolkit/commit/6e6bc025514e1280668595840f41e42801fd773b))

# [3.1.0](https://github.com/lordcraymen/adr-toolkit/compare/v3.0.0...v3.1.0) (2025-10-08)


### Bug Fixes

* update generated timestamp in ACTIVE.md and index.json ([33b093a](https://github.com/lordcraymen/adr-toolkit/commit/33b093a1d01947ab85932249a4dc587e5c177835))
* update package version from 1.3.0 to 3.0.0 in package-lock.json ([9a84440](https://github.com/lordcraymen/adr-toolkit/commit/9a84440b0583e1989398fadd98ba3b4fe2f319c8))
* update status of ADR-0003 to Accepted ([b3f3b15](https://github.com/lordcraymen/adr-toolkit/commit/b3f3b15ce7aaf5f9ce89bbf578eaf63a660ea097))


### Features

* improved husky integration to avoid commit loops ([81e3004](https://github.com/lordcraymen/adr-toolkit/commit/81e300436f15960601986993267ffc3fa087deff))

# [3.0.0](https://github.com/lordcraymen/adr-toolkit/compare/v2.0.0...v3.0.0) (2025-10-07)


### Features

* add interactive options to handleAdrGuidelines and initWorkspace functions ([bd953d4](https://github.com/lordcraymen/adr-toolkit/commit/bd953d4f977515163be4e594a3b9681460848da9))
* improve ADR guidelines implementation ([8884eea](https://github.com/lordcraymen/adr-toolkit/commit/8884eeaf32d58d4bfe07441e69838b92c8322b05))


### BREAKING CHANGES

* AGENT_RULES-snippet.md is no longer created in project root

# [2.0.0](https://github.com/lordcraymen/adr-toolkit/compare/v1.3.0...v2.0.0) (2025-10-07)


### Bug Fixes

* add missing trailing newlines to all feature files ([aee93f4](https://github.com/lordcraymen/adr-toolkit/commit/aee93f41f923090f2bf87c691994a5b43d982294))
* correct release check logic to compare with previous commit ([5488311](https://github.com/lordcraymen/adr-toolkit/commit/548831161b167322f61f97f435692b05d892bbcb))
* update language in guidelines and testing documentation to English ([ab9e871](https://github.com/lordcraymen/adr-toolkit/commit/ab9e871b8f74fdb0d511944bc22ba102da09ba45))


### Features

* Add ADR-0003 for configurable status management ([5409941](https://github.com/lordcraymen/adr-toolkit/commit/5409941f6715d3997bfc673afacef2a696fa176a)), closes [#9](https://github.com/lordcraymen/adr-toolkit/issues/9)
* Add configuration infrastructure for adrx init ([1c27063](https://github.com/lordcraymen/adr-toolkit/commit/1c27063bca85f56e31ebee3a5eec30fd2c50ff70))
* implement configurable status management system ([ed63d53](https://github.com/lordcraymen/adr-toolkit/commit/ed63d5321cd9834a36be906472254ac5317ed5f0)), closes [#9](https://github.com/lordcraymen/adr-toolkit/issues/9)


### BREAKING CHANGES

* Custom status configurations now completely replace default statuses instead of merging with them

# [1.3.0](https://github.com/lordcraymen/adr-toolkit/compare/v1.2.0...v1.3.0) (2025-10-07)


### Bug Fixes

* correct formatting in ACTIVE.md for ADR-0002 entry ([390f210](https://github.com/lordcraymen/adr-toolkit/commit/390f210c772bb4c03b1275b2b222c1585593f9b5))


### Features

* establish English as primary language policy with ADR-0002 ([3b8c78b](https://github.com/lordcraymen/adr-toolkit/commit/3b8c78bf6a38544b06497d5ec0e5d7e6986d6492))

# [1.2.0](https://github.com/lordcraymen/adr-toolkit/compare/v1.1.0...v1.2.0) (2025-10-07)


### Features

* add self-documenting ADR system with automated release decision ([cff5da8](https://github.com/lordcraymen/adr-toolkit/commit/cff5da8cdcdd186a587e48a5f7ca13dcb7d7764c))

# [1.1.0](https://github.com/lordcraymen/adr-toolkit/compare/v1.0.0...v1.1.0) (2025-10-07)


### Bug Fixes

* test automated release pipeline after removing duplicate tag ([46c9514](https://github.com/lordcraymen/adr-toolkit/commit/46c95144f6158f692abf5a64897a9c10d2dfe745))


### Features

* add automated release pipeline with semantic-release ([0c6da41](https://github.com/lordcraymen/adr-toolkit/commit/0c6da4131e9597ec104dbd6ca413246c010dda20))
