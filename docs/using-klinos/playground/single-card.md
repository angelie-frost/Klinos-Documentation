---
title: Single card
description: Turn any Figma layer into a flat card at an angle, sized exactly like your selection.
order: 9
lastUpdated: "[VERIFY: date]"
---

**Mode:** Playground

> **Warning**
> Playground is unreleased. It is merged to main and ships in the next package, v3.16. The packaged 3.15 build doesn't have it.

Playground shows any Figma layer as a flat card at an angle. There is no device, no material and no light. The layer itself is never changed.

It works with an image, shape, vector, text, frame, component or instance.

## Make a card

1. **Select a layer** in Figma.
2. **Open Klinos and click the Playground tab.** The Selection card lists your layer with a thumbnail, its type and its size. The status bar shows its name and size.
3. **Pick an angle.** In the Angle card, choose a preset: Front, Hero, Tilt back, Turn left, Turn right or Lay flat. The default is Hero.
4. **Fine-tune.** Drag the card in the preview to turn it (hold Shift to lock one axis), or use the dials and sliders below.
5. **Set the background and shadow** in the Background and shadow card.
6. **Pick a scale** (1x, 2x or 4x) and click **Insert image**.

## The Angle card

| Control | Range | What it does |
|---|---|---|
| Tilt | -100 to 100 | Tips the card toward or away from you. |
| Turn | -100 to 100 | Turns it left or right. |
| Roll | -180 to 180 | Rotates it in the picture plane. |
| Perspective | 0° to 90° | The camera's field of view. 0° is flat, with no vanishing point. |
| Size | 20 to 200 | How big the card is in the image. The default is 100. |
| Position | on or off | Turn on to move the card with X and Y (-50 to 50), or by dragging. **Center** puts it back. |

With Position on, dragging the card moves it instead of turning it.

## How the card is fitted

The image is always the size of your selection. Klinos fits the turned card inside it and centres it, so nothing is cut off at Size 100. Above the fit, Size crops the card at the edges, and the panel tells you.

## Background and shadow

| Control | Default | What it does |
|---|---|---|
| Transparent background | On | Leaves the background empty. Turn off to use the Canvas colour. The shadow is kept on a transparent background. |
| Canvas | Light grey | The background colour when Transparent background is off. |
| Shadow | Off | A soft shadow traced from the card's outline. |
| Strength, Softness, Distance | 30, 50, 30 | How dark, how soft and how far the shadow falls. |

## Refresh in place

1. Select an image you inserted.
2. Your settings come back, and the button reads **Refresh image**.
3. Change anything, then click **Refresh image**. The image updates in place.

## What you'll see

- The inserted image is placed on the page 80 px to the right of your selection, lined up with its top. It is never placed inside the selection's parent, so auto layout and groups are not disturbed.
- The image is exactly your selection's size, times the scale. Figma's 4096 px limit still applies. For example, a 5000 × 300 layer comes out at 4096 × 246.
- With several layers selected and Arrange as a layout off, the first visible one in the Selection card is the card. The others are listed, dimmed.

> **Tip**
> Want several layers arranged together? Turn on **Arrange as a layout**. See [Layouts](layouts.md).

> **Warning**
> Hidden layers are skipped for now. Klinos shows what Figma exported for each hidden layer in its row, because how Figma exports hidden layers is not yet confirmed.

> **Note**
> Parts of Playground have only been tested in the standalone preview and against a mock of the Figma API. Placement for layers inside auto layout, groups and rotated parents is not yet confirmed in Figma.

## Common mistakes

- **Expecting the device.** Playground has no device or lighting. For a device mockup, use Studio.
- **Dragging to turn with Position on.** Dragging moves the card. Turn Position off, or use the dials.
- **Raising Size and losing the edges.** Above the fit, Size crops. Lower it, or lower Perspective.
- **Using a layer with a blend mode.** Blend modes are lost when a layer is exported on its own.

<!-- Media to capture:
  1. Clip, 6 s, 16:10: select a card-shaped frame, switch to Playground, click through Front, Hero, Turn left and Lay flat.
  2. Clip, 5 s: drag the card in the preview to turn it, then hold Shift to lock one axis.
  3. Screenshot: the Selection card with one layer, showing thumbnail, type and size.
  4. Screenshot pair: Transparent background on, and off with Shadow on.
  5. Clip, 6 s: select an inserted image, change Roll, click Refresh image.
-->
