---
description: Rules protecting Git release tags and ensuring artifact integrity
trigger: always_on
---

# Release Integrity Rules

- Never run `git push origin <tag> --force` against older release versions (`v1.1`, `v1.2`, `v1.3`).
- Always check that user-facing artifact names match `Curry_vX.Y_*` rather than `Curry_X.Y.0_*`.
- Confirm SHA-256 and byte sizes of release assets immediately after uploading.
