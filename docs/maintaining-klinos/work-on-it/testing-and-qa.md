---
title: Testing and QA
description: What verify.js and render.js prove, how UI changes are tested, and the pre-release checklist.
order: 8
lastUpdated: "[VERIFY: date]"
---

## The parse check

```sh
python3 tools/build.py --check
```

It builds, extracts every inline script and runs `node --check` on each, plus `code.js`. Run it after every edit to `src/ui.html`.

## verify.js: parity with V2

```sh
node tools/verify.js
```

**What it proves:** that V3's meshes render the Calibrated look the same as V2's own shaders. It renders V2's shaders from `reference/v2/` and V3's meshes at the same pose, finish, size and design, then compares them pixel by pixel.

- **Two passes per case.** The shading pass uses a flat screen, so only the body, glass and calibrated light are compared. The display pass adds the placeholder design.
- **Gates.** Shading: mean at most 1.0/255, at least 93% of pixels within 2/255, at least 98% of surface interiors within 2/255. Display: mean at most 1.5/255, at least 85% within 2/255.
- **Geometry.** The built meshes are checked against the shader constants. Every row must be within 0.005 mm.
- **Keyboard legends.** A guard runs first. `node tools/verify.js --legends` runs it alone in under a minute.
- **Current numbers:** PASS. Display overall mean 0.65/255, 93.7% within 2/255, interior 99.68%, 38 cases.

**When to run it:** after touching a shader, the geometry, the camera, textures or the laptop's material. It takes 5 to 10 minutes under software GL. Put the numbers in the change description.

It runs headless Chromium with SwiftShader. Numbers on a real GPU can differ in the last bit, but both sides of a comparison run on one backend, so the comparison stays fair.

## render.js: frames, close-ups and diffs

```sh
node tools/render.js frames <outDir> <cases.json>
node tools/render.js closeup <outDir> <cases.json>
node tools/render.js diff <a.png> <b.png>
```

- **frames** renders full composite frames exactly as Insert and Export do: backdrop, shadow, reflection and device. A case can set `state`, a `look`, and `ss` (4 matches exports and settled previews; 1 or 2 also runs the body detail pass).
- **closeup** renders the device layer alone over a flat background. With `rect`, only part of a large virtual frame is rendered, to inspect a port or button at high zoom.
- **diff** compares all four channels. It prints `IDENTICAL (all four channels)` only when no pixel differs in any channel. Otherwise it prints the number of differing pixels, the largest difference and their bounding box.

The case format is at the top of `tools/render.js`. Cases can also be given inline as JSON.

**What "identical" means:** every pixel equal in red, green, blue and alpha. An unchanged render should come back IDENTICAL. When it differs on purpose, say where.

## Testing UI changes with real events

Test panel controls through real UI events (clicks, keys, double-clicks, drags and taps), not by setting state in code. A bug once made every layout slider write to an object the render no longer read; tests that set state directly would have missed it.

Reset layout and the Playground guide were tested this way in the standalone preview, with 247 checks.

These real-UI-event test scripts are not kept in the repo. They live in a temporary folder on the maintainer's computer and may be deleted. The repo's own test tools are `tools/verify.js` (parity with V2, plus a keyboard legend guard) and `tools/render.js` (frames, close-ups and a four-channel diff).

Headless Chromium needs `--disable-site-isolation-trials` for input into a cross-origin iframe.

## Pre-release regression checklist

**Build and parity**
- [ ] `python3 tools/build.py --check` passes.
- [ ] `node tools/verify.js` passes, with numbers recorded.
- [ ] `render.js` frames for unchanged features come back IDENTICAL against the previous build.

**Studio, in Figma desktop**
- [ ] Each device inserts beside its frame at 1x, 2x and 4x.
- [ ] Select a mockup: settings restore and Refresh mockup updates it in place.
- [ ] Each Look renders; Calibrated at 100% looks as before.
- [ ] Polished frame and Surface texture on each phone.
- [ ] Match a photo: trace, Apply angle, Undo angle.
- [ ] Copy pastes onto the Figma canvas.

**Photoreal, in Figma desktop**
- [ ] Both devices and finishes insert, with shadow and backdrop.

**Playground, in Figma desktop**
- [ ] One layer of each type inserts at its own size, beside the selection.
- [ ] Each layout renders; Insert as layers for Arc, Fan and Stack when flat; Rebuild layers.
- [ ] Exploded: layer list, Glass, Clip to frame; no "Klinos temporary" layers left behind.
- [ ] Reset layout and Undo; the (?) guide opens and closes.
- [ ] The open Figma checks from the handoff: hidden layers, layers inside auto layout, groups and rotated parents.

**Panel**
- [ ] Light and dark theme; stacked and side-by-side layouts.
- [ ] Card reorder by drag, menu and Alt+arrows; order persists after reopening.

There is no dedicated test file yet. Releases are checked in the main working file, **Frost AI: Klinos**.
