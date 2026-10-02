---
title: Exporting and copy
description: Insert a mockup into Figma, refresh it, export it as PNG, or copy it to the clipboard.
order: 14
lastUpdated: "[VERIFY: date]"
---

**Mode:** Studio and Photoreal

The bottom of the panel has three things: the scale, **Copy** and **Insert mockup**. Playground uses the same footer, with **Insert image** instead of Insert mockup. See [Insert image vs Insert as layers](../playground/insert.md).

## Insert a mockup

1. Pick a scale: **1x**, **2x** or **4x**. The default is 2x.
2. Click **Insert mockup**. The button reads "Rendering" while it works.

Klinos places the mockup 80 px to the right of your frame, lined up with its top, and selects it. It is named after your frame, for example "Home — mockup".

For the size in pixels at each scale, see [Output size](../studio/framing.md#output-size).

## Refresh a mockup

The mockup keeps its settings. To update it after you change the frame:

1. Select the mockup.
2. Klinos restores its settings, and the button reads **Refresh mockup**.
3. Change anything you like, then click **Refresh mockup**.

Figma shows "Mockup refreshed." when it is done.

## Export as PNG

This is the reliable way to get a mockup out of Figma.

1. Click **Insert mockup**.
2. Select the mockup in Figma.
3. Export it as a PNG.

## Copy to the clipboard

Click **Copy** to put the mockup image on the clipboard at the current scale, then paste it where you need it.

- **Pasting onto the Figma canvas** gives you a frame that contains the image.
- **Pasting into docs, email, notes or slides** gives you the image.
- **Pasting into a plain-text field** gives you SVG code, not a picture.

Copy is quicker, but it may not paste everywhere, because Figma doesn't let plugins copy raw image data. If a paste fails, use Export as PNG.

If the render takes a long time, the browser's copy window can close first. The button then changes to **Copy now**. Click it to finish copying.

## Export in the browser preview

In the standalone preview that runs outside Figma, the main button reads **Export** instead of Insert mockup. It opens the image with its size in pixels and its file size. Right-click the image to save it.

> **Tip**
> When a scale would go past Figma's 4096 px limit, Klinos uses the largest size that fits and says so in the status bar.

## What you'll see

- After Copy, the button reads "Copied" for a few seconds, and the status bar shows the image size.
- After Insert, the new mockup is selected on the canvas.
- If copying is blocked, the status bar says so and suggests Insert instead. Then export the mockup as a PNG.

## Common mistakes

- **Expecting Copy to paste everywhere.** Some apps won't accept the paste. Export the mockup as a PNG instead.
- **Picking 4x for a large frame and expecting 4x.** Figma's 4096 px limit caps it. Check the status bar for the size used.
- **Inserting again instead of refreshing.** Select the existing mockup first, so you update it instead of creating a second one.

<!-- Media to capture:
  1. Clip, 6 s, 16:10: click Insert mockup, the button reads Rendering, the mockup appears beside the frame and is selected.
  2. Clip, 6 s: select an existing mockup, change the finish, click Refresh mockup, the "Mockup refreshed." toast appears.
  3. Clip, 5 s: click Copy, then paste onto the Figma canvas.
  4. Screenshot: the status bar message when 4x is capped by the 4096 px limit.
  5. Clip, 5 s: select an inserted mockup in Figma and export it as PNG.
-->
