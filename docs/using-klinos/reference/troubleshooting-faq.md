---
title: Troubleshooting and FAQ
description: Fixes for blank renders, slow previews and jagged edges, plus the known limits.
order: 3
lastUpdated: "[VERIFY: date]"
---

## The device is blank or black

- **"The GPU dropped the render context. Reopen the plugin."** Close Klinos and open it again. This can happen with very large exports on weaker graphics cards; try a lower scale.
- **"Render failed: …"** followed by an error. Try again at a lower scale, and report it with the message. See [Feedback and bug reports](feedback.md).

## The preview is slow

- **Glass in Exploded layers.** The backdrop blur gets slower with more cards. For 6 cards, a settled frame takes about 880 ms. Lower Layers, or turn Blur down.
- **A zoomed preview on a slow graphics card.** Settled frames re-render the device for clean edges. A maintainer can lower that budget. See [Known issues and roadmap](../../maintaining-klinos/ship-it/known-issues-and-roadmap.md).
- **Many large layers in a Playground layout.** All layers share one texture budget. Past it, Klinos reads each layer at a lower scale.

## Edges look jagged

- **While a control is moving,** the preview uses fewer samples and edges stair-step. They clean up when the preview settles, about 140 ms after you stop.
- **At very high preview zoom,** past about 5x on a high-density screen and always past 8x, the preview is enlarged by the browser and edges go soft. This only affects the preview, not the export.

## When to reopen the plugin

- When the panel says "The GPU dropped the render context. Reopen the plugin."
- When "Klinos temporary" frames are left on the page after an interrupted Exploded read. They are removed when the plugin starts, so reopening Klinos on that page clears them.

## Known limits

**Studio and Photoreal**
- Photoreal has no screen glass or reflection, and one front-on view per render. New angles or devices need new renders.
- Tilt and Turn past 90° show the back of the device. The design then faces away.
- Some details are estimates, not measurements: lens-ring heights and optic sizes on the phones' backs, the MacBook's port insides and right side, some finishes.
- A foldable device is not started.

**Playground**
- Blend modes are lost when a layer is exported on its own.
- Glass is faint on light and transparent backgrounds.
- The Glass blur gets slower with more cards. For 6 cards: about 36 ms for a draft (drafts skip the blur) and 880 ms settled.
- Hidden layers are skipped until it is confirmed what Figma exports for them.
- Placement for layers inside auto layout, groups and rotated parents is not yet confirmed in Figma.
- Large parts of Playground have only been tested in the standalone preview and against a mock of the Figma API: Insert as layers, Stack's editable result, Exploded's reading of frames, Reset layout and the guide.
- Insert as layers differs from the preview: Figma's drop-shadow blur is its own; scaling also scales strokes, effects and text; a layer inside auto layout is copied there for a moment, so the layout reflows and returns.
- Undo after Reset layout lives in the status bar. A new selection or a re-read replaces it, and it ends after 10 seconds anyway.

**Copy and paste**
- A paste on the Figma canvas lands as a frame containing the image.
- In a plain-text field, the copy pastes as SVG code.
- If a paste fails, export the mockup as a PNG instead.

## FAQ

**Why do I see two plugins called Klinos?**
V2 and V3 are both named "Klinos". They have different plugin IDs. Rename one in its local manifest.

**Why can't I refresh an old mockup?**
If it was made with V2, V3 can't read it. Plugin data is private to the plugin that wrote it. Make it again in V3.

**Why doesn't my mockup refresh?**
If the source frame was deleted, Klinos says "This mockup points at a frame that no longer exists. Select a frame to start again."

**Why can't I change the angle in Photoreal?**
Each render is one photograph, taken front-on. Use Studio for an angle.

**Why is Insert as layers greyed out?**
It needs Arc, Fan or Stack, with Perspective, Tilt and Turn at 0. The button's note gives the exact reason.

**Which build do I have?**
Look at the small label at the right of the preview's status bar, for example v3.15.
