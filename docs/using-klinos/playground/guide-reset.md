---
title: Playground guide and Reset layout
description: Open the in-app Playground guide, and reset a layout or a single slider with Undo.
order: 13
lastUpdated: "[VERIFY: date]"
---

**Mode:** Playground

> **Warning**
> Playground is unreleased. It is merged to main and ships in the next package, v3.16. The packaged 3.15 build doesn't have it.

Playground has a short guide built into the panel, and a Reset layout control on every layout. This page covers both.

## Open the in-app guide

1. On the Playground tab, find **Arrange as a layout** in the Layouts card.
2. Click the **(?)** button beside it. It is always shown in Playground.
3. Read the steps, then click **Got it**, press Esc, or click outside the guide to close it.

The guide only opens from the (?). It never opens by itself.

### What the guide covers

1. **Select layers.** Images, shapes, frames or components. One layer becomes one card. Two or more can be arranged.
2. **Set the angle.** Drag the preview, or use Tilt, Turn, Roll and Perspective. The image is always the size of your selection.
3. **Pick a layout.** Turn on Arrange as a layout and pick Arc, Cover flow, Fan, Cylinder, Tunnel or Stack. Drag rows in the Selection card to change the order.
4. **Insert image or Insert as layers.** Insert as layers works for Arc, Fan and Stack when Perspective, Tilt and Turn are 0.
5. **Refresh.** Select something you inserted, edit it, then click Refresh image or Rebuild layers.
6. **Exploded layers.** Select one frame and pick Exploded. Use the layer list to hide, keep in the Base, or Merge ↓.
7. **Reset layout.** Puts the current layout's settings back to their defaults.

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
