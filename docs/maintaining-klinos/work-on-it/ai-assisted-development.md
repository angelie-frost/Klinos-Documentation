---
title: AI-assisted development
description: How CLAUDE.md and the skill folder guide work on the repo, and the rules they set.
order: 9
lastUpdated: "[VERIFY: date]"
---

The repo carries its own instructions for AI-assisted work. The same rules apply to people.

## The files

| File | What it holds |
|---|---|
| `CLAUDE.md` | Working agreements only: layout, how to work in the repo, scope, packaging. |
| `.claude/skills/klinos-v3/SKILL.md` | The rulebook: render pipeline, the calibrated material, the lighting model, geometry provenance, Figma constraints, each mode's design, where to make a change, and decisions already made. |
| `.claude/skills/klinos-v3/REFERENCE.md` | Constants, camera and lighting maths, export rules, Figma API limits and debugging. |
| `docs/PARITY.md` | Every V2 Studio feature and where V3 keeps it. |
| `docs/HANDOFF.md` | Current state, version history, open items and pitfalls, for picking the work up in another environment. |

`CLAUDE.md` doesn't restate the skill or the parity file. It points to them.

## The working rules

From `CLAUDE.md`:

1. **Edit `src/`, then build.** Never patch `ui.html`; the next build overwrites it.
2. **Assert before replacing.** A scripted replacement must confirm its anchor exists exactly once.
3. **Verify the parse** with `python3 tools/build.py --check` after every edit to `src/ui.html`. Don't report a change as done before it passes.
4. **Run the parity harness** (`node tools/verify.js`) after touching a shader, the geometry or the camera. Numbers go in the change description.
5. **Check visual changes before and after** with `node tools/render.js`. An unchanged render should come back IDENTICAL.
6. **Plan first** on anything touching the calibrated material, the geometry constants or the camera model. Propose the approach and wait.
7. **The calibration is data, not taste.** Never adjust it by eye. Art direction goes in a Look.
8. **Do only what was asked.** No new devices or modes without a request, no refactors riding along with a fix, no new dependencies.
9. **Ask before** changing `manifest.json`, upgrading Three.js, adding to `vendor/`, changing the settings schema version, or moving files between `src/` and `tools/`.

## Habits from the skill and handoff

- **Test controls through real UI events,** not by setting state.
- **Compare renders across all four channels** with `tools/render.js diff`.
- **Give long render and verify commands 5 to 10 minutes.**
- **Keep `docs/HANDOFF.md` current** with state and version history, so the next session can pick up the work.

## Keeping the docs in step

When the code changes, update the skill, `HANDOFF.md` and `PARITY.md` in the same change.

This docs site is a separate project from the plugin repository. Docs updates are made on their own, not in the same commit or pull request as a code change.
