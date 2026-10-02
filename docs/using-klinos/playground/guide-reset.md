---
title: Playground guide and Reset layout
description: Open the in-app Playground guide, and reset a layout or a single slider with Undo.
order: 13
lastUpdated: "[VERIFY: date]"
---

**Mode:** Playground

Playground has a short guide built into the panel, and a Reset layout control on every layout. This page covers both.

## Open the in-app guide

1. On the Playground tab, find **Arrange as a layout** in the Layouts card.
2. Click the **(?)** button beside it. It is always shown in Playground.
3. Read the steps, then click **Got it**, press Esc, or click outside the guide to close it.

The guide only opens from the (?). It never opens by itself.

### In-app guide: Using Playground

Playground shows any Figma layer as a flat card at an angle. There is no device.

1. ![](/guides/playground-step-1.svg) **Select layers** Select any layers in Figma: images, shapes, frames or components. One layer becomes one card. Two or more can be arranged.
2. ![](/guides/playground-step-2.svg) **Set the angle** Drag the preview, or use Tilt, Turn, Roll and Perspective. The image is always the size of your selection.
3. ![](/guides/playground-step-3.svg) **Pick a layout** Turn on **Arrange as a layout** and pick Arc, Cover flow, Fan, Cylinder, Tunnel or Stack. Drag the sliders to shape it. Drag rows in the Selection card to change the order. In Cover flow, click a card in the preview to bring it to the front.
4. ![](/guides/playground-step-4.svg) **Insert image or Insert as layers** **Insert image** places a picture and keeps any angle. **Insert as layers** places editable copies of your layers. It works for Arc, Fan and Stack when the view is flat: Perspective, Tilt and Turn at 0.
5. ![](/guides/playground-step-5.svg) **Refresh** Select something you inserted. Your settings come back. Edit them, then click **Refresh image** or **Rebuild layers** to update it in place.
6. ![](/guides/playground-step-6.svg) **Exploded layers** Select one frame and pick Exploded. Its layers stack apart in depth. In the layer list, hide a layer, keep it in the **Base**, or **Merge ↓** it into the card below. Reset in the list goes back to the automatic grouping.
7. ![](/guides/playground-step-7.svg) **Reset layout** **Reset layout** puts the current layout's settings back to their defaults. Undo appears in the status bar for a few seconds. Double-click a slider's name or value to reset only that slider. Nothing else changes: not your selection, the angle, the background or the layer list.

## Reset a whole layout

1. Find **Reset layout** in the row above the current layout's sliders.
2. Click it. That layout's settings go back to their defaults.
3. To take it back, click **Undo** in the status bar. "Layout reset · Undo" stays for 10 seconds.

Reset layout is greyed out when the layout is already at its defaults.

### What Reset layout changes, and what it leaves alone

| Reset | Left alone |
|---|---|
| The current layout's own settings | Your selection and its order |
| | The Angle card |
| | Size and Position |
| | Background and shadow |
| | Equal heights and Repeat to |
| | Other layouts' settings |
| | Exploded's layer list, which has its own Reset |

## Reset one slider

Double-click a slider's **name** or its **value** to reset only that slider. Double-clicking the track doesn't reset it, because the track drags.

## When Undo goes away

The Undo offer ends when any of these happen:
- 10 seconds pass.
- You edit the layout again.
- You switch layouts.
- You select something else, or Klinos re-reads the selection.

Undo is kept in memory only. It isn't saved with the mockup.

> **Tip**
> Exploring a layout? Reset layout is a safe way back to the starting point, because it never touches your angle, background or layer list.

## What you'll see

- The guide shows seven numbered steps with small diagrams that follow the light or dark theme.
- After Reset layout, the status bar reads "Layout reset · Undo".
- Reset layout is greyed out at the defaults.

## Common mistakes

- **Expecting Reset layout to reset the angle.** It doesn't. A layout's angle is only applied when you pick the layout.
- **Waiting too long to Undo.** The offer lasts 10 seconds and ends with any other edit.
- **Double-clicking the slider track.** Use the slider's name or value instead.

<!-- Media to capture:
  1. Clip, 5 s, 16:10: click the (?) beside Arrange as a layout, scroll the guide, click Got it.
  2. Screenshot: the full Playground guide dialog.
  3. Clip, 6 s: change two Arc sliders, click Reset layout, then Undo in the status bar.
  4. Clip, 4 s: double-click the Spacing value to reset only that slider.
-->
