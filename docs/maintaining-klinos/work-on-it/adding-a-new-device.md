---
title: Adding a new device
description: How a Studio device is ported or added, and how parity is checked.
order: 7
lastUpdated: "[VERIFY: date]"
---

> **Warning**
> Don't add a device without a request. Plan first: a new device touches geometry constants and the material, and a shading regression is invisible until it is side by side with a reference.

There are two cases: porting a device that V2 had, and adding one with no V2 version, like the Galaxy S26. Photoreal devices are a separate process; see the end of this page.

## What a Studio device is made of

| Part | Where |
|---|---|
| Shader with the shape constants and the calibrated material | `src/shaders/<device>.glsl` |
| JavaScript entry: size, display, finishes, export multiplier, brightness max | `DEVICES` in `src/ui.html` |
| Mesh constants | `GEO` in `src/ui.html` |
| Mesh builder | a `build…()` function in `src/ui.html`, built from the shader's own constants |
| Picker group and spec line | `DEVICE_GROUPS` and `DEVICE_META` in `src/ui.html` |
| Angle presets | `PRESETS` (phones, tablet) or `LAPTOP_PRESETS` |

Change the shape constants in the shader **and** `DEVICES` together.

## Porting a V2 device

1. **Port the shader.** V2's shaders live verbatim in `reference/v2/`. `tools/port_v2_shaders.py` writes `src/shaders/` from them, applying asserted, single-match edits. Make edits in the script, then re-run it. Never edit the generated shader by hand.
2. **Build the mesh from the shader's constants.** Bodies are `ExtrudeGeometry` of the rounded rectangle, with a bevel that matches the shader's edge round. Bumps, plateaus and buttons follow the shader's placement.
3. **Check the geometry.** `geometryRows()` measures the built mesh against the constants. `verify.js` fails any row over 0.005 mm.
4. **Add parity cases** to `tools/verify.js`: the presets and finishes at the same pose, size and design as V2.
5. **Run `node tools/verify.js`** until it passes the gates. Record the numbers in the change description.
6. **Update `docs/PARITY.md`** with each V2 control and behaviour, and where V3 keeps it.

## Adding a device with no V2 version

The Galaxy S26 is the precedent.

1. **Get references.** Its shape came from Samsung's own views. Its Black finish was fitted on the GPU to Samsung's flat side views. Finishes with no photo use the maker's swatch colour through the one measured transfer, and are marked ESTIMATE.
2. **Write the shader by hand.** `galaxy.glsl` has no V2 twin. It shares the 17 Pro's aluminium material, and `build.py` (`SHARED_GLSL`) checks that the shared functions haven't drifted from `phone17.glsl`.
3. **Add the `DEVICES` entry, mesh builder, picker group and spec line.**
4. **Mark estimates.** Anything not measured is marked ESTIMATE or ART-DIRECTED in its source comment.
5. **Check before and after** with `node tools/render.js` (`frames` and `closeup`). There is no V2 parity case for such a device.

## Pitfalls

- An `else if` chain builds the per-device uniforms in `makeDeviceMaterial`. Add new device-specific uniforms as separate `if` lines above it.
- Compare renders across all four channels. Pillow's `getbbox()` on an RGBA difference looks at alpha only, so a colour change reads as identical. `tools/render.js diff` compares every channel.

## The foldable, not started

The handoff lists what a foldable body needs: a fold parameter (the laptop's lid is the precedent), a crease, a second display slot, and reference photos (open, folded, hinge edge, with scale).

## Adding a Photoreal device

Photoreal renders are never the Studio meshes.

1. Put the PNG in `reference/photoreal/`: transparent background, screen in key green (51, 255, 54).
2. List it in `RENDERS` in `tools/photoreal_assets.py` and in `PR_DEVICES` in `src/ui.html`.
3. Run `python3 tools/photoreal_assets.py` (needs Pillow and numpy).
4. Build.
