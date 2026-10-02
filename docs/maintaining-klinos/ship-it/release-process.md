---
title: Release process
description: The packaging steps the repo defines, and the parts the team still needs to confirm.
order: 11
lastUpdated: "[VERIFY: date]"
---

## Package a build

1. Find the highest `dist/klinos-v3-<n>.zip`.
2. Set `VERSION` to `3.<n+1>`. The next package is v3.16.
3. Run:

```sh
python3 tools/build.py --package
```

This builds, runs the parse check, and zips `manifest.json`, `code.js` and `ui.html` into `dist/klinos-v3-<n+1>.zip`. It refuses to build if `VERSION` and the zip number disagree.

## Before you package

Run the checks in [Testing and QA](../work-on-it/testing-and-qa.md), including the pre-release checklist.

Update `docs/HANDOFF.md` (state and version history) and `docs/PARITY.md` where the change affects V2 parity.

## Publish the build

The Chief Creative Officer publishes new versions to the company's Figma organization.

## Announce it

Releases are announced in the team's Google Chat or in a Checkpoint update, depending on the release.

The docs site is a separate project. Update its Changelog there, on its own.

> **Warning**
> Don't change `manifest.json` as part of a release without asking first. Plugin data is private to the plugin ID, so saved mockups depend on it.
