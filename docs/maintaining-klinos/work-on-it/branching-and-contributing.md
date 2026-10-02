---
title: Branching and contributing
description: How changes are branched, described and reviewed.
order: 6
lastUpdated: "[VERIFY: date]"
---

## What the repo says

- Work is merged to `main`. The Playground commits, for example, were merged to `main` in `792d5ff`.
- Each change has a **change description**. `verify.js` numbers go in it, and larger features keep their Figma test checklist there.

## Branches

Each feature or fix is developed on its own branch off `main`. Nothing is committed directly to `main`.

Branch names follow `type/short-description`, for example:

```
feature/laptop-mockup
fix/webgl-crash
```

## Commit messages

Commit messages follow Conventional Commits, for example:

```
feat: add laptop mockup support
fix: resolve keyboard legend rendering bug
```

## Review

Anyone with access to the GitHub repository can review changes.

## Working rules for every change

These come from `CLAUDE.md` and apply to everyone.

- **Edit `src/`, then build.** Never patch `ui.html`.
- **Run `python3 tools/build.py --check`** after every edit to `src/ui.html`. A change isn't done until it passes.
- **Assert before replacing.** Any scripted string replacement must confirm its anchor exists and appears exactly once. A double match once injected lines into two handlers and shipped silently.
- **Run `node tools/verify.js`** after touching a shader, the geometry, the camera, textures or the laptop's material. Put the numbers in the change description.
- **Check visual changes before and after** with `node tools/render.js`. An unchanged render should come back IDENTICAL; say where it differs when it should.
- **Plan first** on anything touching the calibrated material, the geometry constants or the camera model. Propose the approach and wait.
- **Do only what was asked.** No new devices or modes without a request, no refactors riding along with a fix, no new dependencies.

## Ask before

- Changing `manifest.json`.
- Upgrading Three.js.
- Adding to `vendor/`.
- Changing the settings schema version.
- Moving files between `src/` and `tools/`.

See [Testing and QA](testing-and-qa.md) for the checks to run.
