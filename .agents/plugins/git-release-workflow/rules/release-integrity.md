---
description: Rules protecting Git release tags and ensuring artifact integrity
trigger: always_on
---

# Release Integrity Rules

Authoritative policy: [RELEASE_POLICY.md](file:///c:/Users/omer/Projects/Curry/docs/governance/RELEASE_POLICY.md)

- Never run `git push origin <tag> --force` against any existing release tag (`v*`). All historical tags are immutable.
- Always check that user-facing artifact names match `Curry_vX.Y_*` rather than `Curry_X.Y.0_*`.
- Confirm SHA-256 digests and byte sizes of release assets immediately after uploading.
- Release publication and asset replacement require explicit user confirmation.
