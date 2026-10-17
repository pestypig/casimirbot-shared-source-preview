# CasimirBot shared source preview

This MIT-licensed, source-only snapshot opens a selected part of CasimirBot's shared TypeScript implementation: contracts, policy types, research and theory metadata, and selected tests. It contains 1,477 files from platform commit `2729878dee699a975cd8738d123baa0c341dc1ec`. The full Windows workstation, hosted server, website, and historical platform repository are separate.

## What is here

- Versioned contracts and validation code used across parts of the platform.
- Shared policy and evidence types for bounded AI and software workflows.
- Research calculators, theory registries, and tests for inspection and reuse.
- An [exact source inventory](SOURCE_SELECTION.json) with SHA-256 hashes and reasons for excluding 106 other `shared/` files whose static imports need other platform roots or untracked generated files.

The source inventory includes research status and proof-policy code. A schema, status label, test fixture, or diagnostic output is not empirical confirmation or a physical-viability certificate. Check the underlying evidence and maturity gate before relying on a scientific claim.

## Build and integration status

This is **not a standalone SDK or runnable CasimirBot platform**. All selected TypeScript files parse, but a full strict semantic check exhausted the review workstation's 2 GB Node heap. A narrower contract check reported 143 TypeScript diagnostics. This repository does not promise a passing independent build or a supported endpoint. For working integration examples, see the [environment connector kit](https://github.com/pestypig/casimirbot-environment-connector-kit) and [verifier source preview](https://github.com/pestypig/casimirbot-verifier-source).

The code references `zod`, `@noble/hashes`, Node built-ins, and `vitest` in tests. Third-party library source is not bundled. See [third-party notices](THIRD_PARTY_NOTICES.md).

## Source boundary and license

The selected files are byte-identical to the committed platform source named in `SOURCE_SELECTION.json`. The inventory records the 106 excluded files. This snapshot contains no platform Git history, local workstation profiles, collected chats, or imported media. It does not grant access to hosted services or the private development repository.

The first-party content in this snapshot is released under the [MIT License](LICENSE). Upstream licenses govern separately obtained dependencies.
