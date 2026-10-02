---
title: Versioning
description: How build numbers work and where they show.
order: 10
lastUpdated: "[VERIFY: date]"
---

## The build number

- The build number lives in the `VERSION` file, for example `3.15`.
- It is shown in the panel, as the small label at the right of the preview's status bar.
- It has the form `3.<n>`, where `<n>` matches the package zip `dist/klinos-v3-<n>.zip`.

`tools/build.py --package` refuses to build if `VERSION` and the zip number disagree. That way the label in the panel always names the zip it shipped in.

## Work between packages

Work after a package keeps the last `VERSION` until the next package.

Today `VERSION` is 3.15 and the newest package is `dist/klinos-v3-15.zip`. The labels "v3-16" and "v3-17" in the handoff notes were only working labels.

## The plugin ID

`manifest.json` in the repo uses the ID `klinos-v3-dev`. Designers install Klinos from the company's Figma organization.

Plugin data on a mockup is private to the plugin ID that wrote it. That is why V3 can't read mockups made by V2, which has a different ID.

Changing `manifest.json` needs asking first.

## Settings version

Saved mockup settings carry their own version, `SETTINGS_V = 3`. It is separate from the build number. See [Data and compatibility](../understand/data-and-compatibility.md).
