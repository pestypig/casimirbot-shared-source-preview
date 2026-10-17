# CasimirBot shared source preview

This MIT-licensed, source-only snapshot opens 1,583 selected CasimirBot shared files: an initial 1,477-file selection from private platform commit `2729878dee699a975cd8738d123baa0c341dc1ec` and a 106-file TypeScript addendum from private platform commit `0b2aa26db3d0c7d08af27c371a3cf618f7561f58`. The full Windows workstation, hosted server, website, and historical platform repository are separate.

## What is here

- Versioned contracts and validation code used across parts of the platform.
- Shared policy and evidence types for bounded AI and software workflows.
- Research calculators, theory registries, and selected tests for inspection and reuse.
- An [initial source inventory](SOURCE_SELECTION.json) and [106-file addendum inventory](SOURCE_ADDENDUM.json), each with per-file SHA-256 hashes and byte lengths. The initial inventory records why these 106 paths were originally excluded; the addendum now publishes their reviewed source bytes.

The source includes research status and proof-policy code. A schema, status label, test fixture, or diagnostic output is not empirical confirmation or a physical-viability certificate. Check the underlying evidence and active maturity gate before relying on a scientific claim. The addendum's NHM2 content is implementation or preexecution source; it does not establish accepted proof, propulsion, or transport authority.

## Build and integration status

This is **not a standalone SDK or runnable CasimirBot platform**. The 106 addendum TypeScript files parsed with zero syntax diagnostics. Their static imports include 33 references outside the combined published shared files, including server/client code, research configuration and fixtures, scripts, and other platform roots. A full strict semantic check of the initial selection exhausted the review workstation's 2 GB Node heap; a narrower initial contract check reported 143 TypeScript diagnostics. No combined independent build is claimed. For working integration examples, see the [environment connector kit](https://github.com/pestypig/casimirbot-environment-connector-kit) and [verifier source preview](https://github.com/pestypig/casimirbot-verifier-source).

The code references `zod`, `@noble/hashes`, Node built-ins, and `vitest` in tests. Third-party library source is not bundled. See [third-party notices](THIRD_PARTY_NOTICES.md).

## Source boundary and license

The initial 1,477 files match their committed platform source after CRLF/LF line-ending normalization; their public Git blobs are not byte-identical to the private source-commit blobs. The hashes and byte lengths in `SOURCE_SELECTION.json` identify those public snapshot files. The 106 addendum files are byte-identical to their named private source-commit blobs, and `SOURCE_ADDENDUM.json` identifies those same bytes. This clean-history preview contains no platform Git history, local workstation profiles, collected chats, or imported media. It does not grant access to hosted services or the private development repository.

The first-party content in this snapshot is released under the [MIT License](LICENSE). Upstream licenses govern separately obtained dependencies.
