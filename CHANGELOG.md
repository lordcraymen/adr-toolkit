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
