# Workshift

Cross-platform desktop app for shift scheduling, hour tracking, and export.

## Download

- Latest release (all platforms): [releases/latest](releases/latest)
- Direct latest assets can also be linked with:
  - `https://github.com/<owner>/<repo>/releases/latest/download/<asset-name>`

## Automated Releases

This repository includes an automated GitHub Actions pipeline:

- Workflow file: `.github/workflows/release-tauri.yml`
- Trigger: push a Git tag matching `v*` (example: `v0.2.0`)
- Output: builds Tauri bundles for macOS, Windows, and Linux and publishes them as GitHub Release assets.

The workflow also validates that:

- `package.json` version
- `src-tauri/tauri.conf.json` version
- `src-tauri/Cargo.toml` version
- tag version (`vX.Y.Z`)

all match, otherwise the release fails early.

## Release Process

1. Update version in:
   - `package.json`
   - `src-tauri/tauri.conf.json`
   - `src-tauri/Cargo.toml`
2. Commit and push to `main`.
3. Create and push a version tag:
   - `git tag v0.2.0`
   - `git push origin v0.2.0`
4. Open GitHub Actions and monitor `Release Tauri App`.
5. When it finishes, the release is available at `/releases/latest` with downloadable assets.
