---
title: Decisions log
description: Decisions already made, and why. Don't reopen these without a reason.
order: 3
lastUpdated: "[VERIFY: date]"
---

These come from `CLAUDE.md`, the skill file and `docs/PARITY.md`.

## The calibration is data, not taste

Finish F0 values, band tones, the Calibrated rig, `BODY_EXPOSURE` and `BODY_WHITE`, `envBRDF` and `encodeBody` were fitted to measured references in V2. They are never adjusted by eye. A change needs a measured reason, a note of the measurement, and a passing `verify.js`.

## Meshes plus V2's material, not Three's PBR

A bake-off measured the port at 0.33 to 0.64/255 mean error against V2 across finishes and poses. Re-fitting the calibration to a new model would have thrown it away, so it was ported unchanged.

## The showcase look comes from Looks, not the material

V2's finishes were fitted to Apple's own lineup renders. Moving the material would move it away from Apple. Art direction goes in a Look. Calibrated stays the default. Keynote, for example, is a Look designed around the laptop and never touches the material.

## Three.js r149, UMD, inlined

It is the last release with a UMD build and no deprecation warning. `networkAccess` is `none`, so ES module imports would need a bundler. A single inlined script needs nothing. Ask before upgrading.

## No network, no new dependencies

`networkAccess` is `none`. Nothing is fetched at runtime, and every asset ships in the bundle.

## Screen glare does something

In V2 the switch was shown but only fed other render paths. V3 gates the glass reflection with it. On, the default, is V2's image.

## No body colour for these devices

V2's Body swatch only reached its clay renderer. The finish chips are the body colour here.

## Settings are versioned

Mockup settings carry `v = 3`. V2 mockups can't be refreshed by V3, because plugin data is private to the plugin ID that wrote it.

## The right panel is V2's design language

V2's tokens, 13 px system type, 18 px cards, ink (never blue) for selection and switches, V2's dials, fields and footer. New V3 controls are built from those parts. The dark theme is the same language on Figma's dark grey. The preview column is not part of it.

## The laptop is compared at 720 × 900

At 360 × 450 its keys are sub-pixel and V2 fails the gates against itself. Where a case still misses against V2's shipping jitter, it passes only on V2's own measured sampling floor, printed `ok~`.

## Supersampling is chosen per frame

Code that needs to know whether a frame is a draft reads `drafting`, not `ssNow`. A settled frame or export can run at ss 4 or ss 1, and a draft at ss 2.

## The design texture is mipmapped; placeholders are not

The Figma frame arrives at 2x and is usually shown smaller, so the design gets trilinear mipmaps. The placeholders keep V2's linear sampling, so `verify.js` compares like with like.

## Live controls never render per event

Input writes state and requests an animation frame. Expensive work waits for the frame to settle. Anything that reads pixels back from the GPU stays out of the draft path.

## The sweep has one edit from V2

`backdrop.glsl` is V2's backdrop plus one approved seam fill, made through `tools/port_v2_shaders.py`. It was proved on 152 frames. Don't add further edits without the same proof.

## Not carried from V2, by scope

V2's Photoreal bundles and Nudge, Screen mode, "Match nearest photoreal" and the clay finish. V3 has its own Photoreal mode, built on new renders.
