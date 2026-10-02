---
title: Insert image vs Insert as layers
description: Place a Playground result as one image, or as editable rotated copies of your layers.
order: 11
lastUpdated: "[VERIFY: date]"
---

**Mode:** Playground

Playground can place its result two ways. **Insert image** places a picture and keeps any angle. **Insert as layers** places editable copies of your layers, rotated and positioned like the preview.

## Insert image

1. Pick a scale at the bottom of the panel: 1x, 2x or 4x.
2. Click **Insert image**.

The image is the size of your selection (or of all the selected layers together), times the scale. Klinos places it on the page 80 px to the right of the selection, lined up with its top.

Figma accepts images up to 4096 px on the longest side. If a scale would go past that, Klinos uses the largest size that fits and says so in the status bar.

## Insert as layers

Insert as layers places real Figma layers you can edit, instead of a picture.

It works only when:
- the layout is **Arc**, **Fan** or **Stack**, and
- **Perspective** is 0 and **Tilt** and **Turn** are 0. Roll is fine.

The button sits in the Layouts card. When it can't be used, it is disabled and tells you why, for example:
- "Set Perspective to 0° (flat) to insert as editable layers."
- "Set Tilt and Turn to 0° to insert as editable layers (Roll is fine)."
- "Exploded goes in as an image only."

### What it creates

1. A transparent frame that clips its content, the size of the selected layers together, 80 px to their right.
2. Inside it, a copy of each layer, rotated, scaled and positioned like the preview. Instances stay instances. A component goes in as an instance, so the main component is never duplicated. Locked layers are unlocked in the copy.
3. One drop shadow, on a group of the copies called **Cards**, so Figma shadows them together as the preview does.

For Stack, Depth fade becomes each copy's opacity, and card shadows become one drop shadow per copy. Depth dim is not carried; the button's note says so when it is on.

Klinos checks everything first: that the layers still exist, that none is a component set or section, and that every font it needs loads. If any check fails, nothing is created.

### Rebuild layers

1. Select a frame you inserted as layers.
2. Your settings come back, and the button reads **Rebuild layers**.
3. Click it to replace the frame's contents in place. Its position and name are kept, and it is resized to fit.

Clicking **Insert image** on that selection makes a new image instead.

> **Warning**
> Insert as layers differs from the preview in a few ways. Figma's drop-shadow blur is its own. Scaling a copy also scales its strokes, effects and text. A layer inside auto layout is copied there for a moment, so the layout reflows and then returns.

> **Note**
> Insert as layers has only been tested against a mock of the Figma API so far. It isn't available in the standalone browser preview.

## Copy

**Copy** puts the image on the clipboard, as in Studio. See [Exporting and copy](../panel/exporting.md).

## What you'll see

- After Insert image, the new image is placed beside your selection.
- After Insert as layers, a frame with your copies appears beside your selection, with a Cards group inside.
- The disabled Insert as layers button shows the reason in its note.

> **Tip**
> To get editable layers, set Perspective, Tilt and Turn to 0 first. Use Roll for angle.

## Common mistakes

- **Trying Insert as layers on Cover flow, Cylinder or Tunnel.** They need perspective, so they go in as images.
- **Leaving Perspective above 0.** Insert as layers needs a flat view.
- **Expecting Depth dim in the layers.** It isn't carried. Use Depth fade if you need it in Stack.
- **Selecting a component set or section.** They can't be copied into a frame. Use Insert image.

<!-- Media to capture:
  1. Clip, 8 s, 16:10: Fan with Perspective, Tilt and Turn at 0, click Insert as layers, then expand the new frame in the Layers panel to show the Cards group.
  2. Screenshot: the disabled Insert as layers button with its reason, on Cover flow.
  3. Clip, 6 s: select the inserted frame, change Fan angle, click Rebuild layers.
  4. Screenshot: the status bar message when 4x is capped by the 4096 px limit.
-->
