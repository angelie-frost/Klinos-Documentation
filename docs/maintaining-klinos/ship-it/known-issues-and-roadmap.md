---
title: Known issues and roadmap
description: Open items, known limits and what isn't built yet, from the handoff notes.
order: 12
lastUpdated: "[VERIFY: date]"
---

## Not yet run in Figma

- Large parts of Playground have only been tested in the standalone preview and against a mock of the Figma API: Insert as layers (Phase C), Stack's editable result, Exploded's reading of frames (temporary copies, masks, auto layout, instances), Reset layout and the guide. The Figma checklists in their change descriptions have not been run yet.
- What Figma's `exportAsync` returns for a hidden layer, or one inside a hidden parent. Each hidden layer is exported small once and its row shows the result; it is also logged as `[Klinos Playground] hidden layer export`. Until that is read in Figma, the active layer skips hidden ones.
- Placement on the page for Playground sources inside auto layout, groups and rotated parents.

## Known limits

**Playground**
- Blend modes are lost when a layer is exported alone.
- Glass is faint on light and transparent backgrounds.
- Glass blur cost grows with the card count. For 6 cards: 36 ms for a draft (drafts skip the blur), 880 ms settled.
- Insert as layers differs from the preview: Figma's drop-shadow blur is its own (radius set to twice the preview's sigma); `rescale()` scales strokes, effects and text; a source inside auto layout is cloned there for a moment, so the layout reflows and returns.
- The Undo after Reset layout lives in the status pill. Anything that rewrites the pill hides it, and it lapses after 10 seconds.

**Studio and Photoreal**
- Photoreal has no screen glass or reflection and one front-on view per render. New angles or devices need new renders.
- Tilt and Turn past 90° show the device's back; the design faces away.
- Drafts are 1 to 2 samples by design and stair-step until the frame settles (140 ms). Past the preview's 4096 px backing cap (about 5x zoom on a 2x screen, always past 8x), the canvas is enlarged by CSS and edges soften.
- The body detail pass renders the device twice in settled frames below 4x4 samples. If a slow GPU struggles in a zoomed preview, lower `BODY_DETAIL_PX.preview`. In the unreleased work, 4x exports take the 4x4 pass on the device, about 1.7 times the cost of a 2x export.

**Estimates, not measurements**
- Lens-ring heights above the plateau, bump or island (17 Pro 1.30, iPhone 13 0.90, S26 1.11 mm) and the optic radii.
- The MacBook's port internals and its right side.
- The S26's Silver Shadow and Sky Blue finishes; the iPhone 13's Blue and Starlight finishes; the island's lens radii.
- The iPhones carry no Apple logo on the back (not requested). The S26 has no back mic (none visible in the reference).

**Other**
- Two plugins named "Klinos": with V2 and V3 both imported, rename one in its local manifest. The IDs differ, so saved mockups are unaffected.
- A Figma paste lands as a frame containing the image. In a plain-text field it pastes as SVG code. Where a paste fails, export the mockup as a PNG.
- Card order is per user, not per file.

## Unreleased and in progress

Merged to `main`, not packaged. All of this ships together in the next package, v3.16:
- Staging, with Revert and the Spotlight Look.
- Back cameras on the three phones.
- Card reordering.
- Playground: Layouts, Stack, Insert as layers, Exploded layers, Reset layout and the guide.
- The Cover flow overlap: negative Centre gap down to -75%, a Focus card number field with Middle, click a card to focus it.

"v3-16" and "v3-17" in the handoff notes were only working labels.

## Roadmap

- **Staging multiples** (Phase B): several copies of one device in a scene. Planned, not built.
- **A foldable device.** Not started. It needs a fold parameter (the laptop's lid is the precedent), a crease, a second display slot, and reference photos (open, folded, hinge edge, with scale).
