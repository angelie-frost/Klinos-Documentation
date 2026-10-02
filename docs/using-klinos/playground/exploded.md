---
title: Exploded layers
description: Show one frame's layers as cards stacked apart in depth, with a layer list, plates, labels and lines.
order: 12
lastUpdated: "[VERIFY: date]"
---

**Mode:** Playground

Exploded layers is the "anatomy of a screen" shot. Klinos takes one frame and stacks its layers apart in depth, so you can show how the screen is built.

## Explode a frame

1. **Select one frame** in Figma. A component or instance works too. It needs at least two visible layers.
2. In Klinos, on the Playground tab, turn on **Arrange as a layout**. **Exploded** is the only layout offered.
3. Set how many cards you want with **Layers**.
4. Adjust **Gap**, **Twist**, plates, labels and lines.
5. Use the **layer list** to choose exactly which layers float, stay in the base, or merge.
6. Click **Insert image**. Exploded goes in as an image only.

## How the cards are made

- The bottom card is the frame's background: its fill, stroke and effects.
- The other cards are the frame's visible layers, bottom first.
- A mask and the layers above it in the same parent stay together on one card.
- **Layers** (2 to 12, default 6) sets the number of cards. Klinos merges neighbouring layers, smallest first, to reach it.
- **Depth 2** (Off or On) opens one more level: direct child groups and frames are split into their own layers.

The image is the frame's size. Portrait frames start at a steep tilted view (Tilt -52, Perspective 30). Landscape frames start flatter (Tilt -58, flat).

## The layer list

The list shows the frame's layers, top first. For each one:

| Button | What it does |
|---|---|
| Show (eye) | Hides or shows the layer. |
| Base | Keeps the layer on the background card. |
| Merge ↓ | Joins the layer to the card below it. With no floating card below, it joins the base. |

**Reset** in the list goes back to the automatic grouping from the Layers slider. While you use the list, the Layers slider rests and a note says "Custom grouping - Reset to use Layers."

Your list choices are saved with the image, so a refresh keeps them.

If a layer is renamed, moved or deleted, its saved choice is dropped rather than applied to the wrong layer. The note says, for example, "1 saved choice no longer matches a layer (renamed, moved or deleted)." A layer the list doesn't know yet gets its own card.

## View settings

| Setting | Range | Default | What it does |
|---|---|---|---|
| Gap | 0 to 200% | 90% | The space between cards, as a share of the frame width. |
| Twist | -60° to 60° | -30° | Turns every card in its plane. |
| Plates | On or Off | On | A faint frame-sized sheet behind each layer. |
| Plate style | Plain or Glass | Plain | Glass gives frosted sheets with a backdrop blur. |
| Opacity | 0 to 100% | 22% | Glass only. How white the sheets are. |
| Blur | 0 to 40 px | 14 px | Glass only. How much the sheets blur what is behind them. |
| Clip to frame | On or Off | On | Off lets a layer that runs past the frame show beyond its sheet. |
| Lines | Off, Corners or Outline | Corners | Corners draws dashed lines card to card. Outline draws each frame's outline. |
| Labels | Off, Left or Right | Right | Layer names in a side column, with leader lines to each layer. |
| Highlight | 0 to 12 | 0 | Picks one card and dims the others. |
| Depth dim | 0 to 100% | 0% | Darkens cards with distance. |
| Card shadows | On or Off | On | A shadow under each card, falling on the cards behind. |
| Strength, Softness, Distance | 0–80, 0–100, 0–100 | 30%, 45%, 30% | How the card shadows look. |

Changing Layers, Depth 2 or Clip to frame re-reads the frame. Everything else only changes the view.

## Temporary layers

To read each card, Klinos makes a temporary copy of your frame named **Klinos temporary**, 100000 px off to the side. It removes the copy straight after each read. If one is ever left behind, it is removed the next time Klinos starts. Your own frame is never changed.

> **Warning**
> Glass is faint on light and transparent backgrounds. Use a darker Canvas colour so the sheets read.

> **Tip**
> Glass blur gets slower with more cards. For 6 cards, a draft takes about 36 ms (drafts skip the blur) and a settled frame about 880 ms. Lower Layers if the preview feels slow.

> **Note**
> Exploded layers has been tested in the standalone preview and against a mock of the Figma API. Its reading of frames, masks, auto layout and instances still needs a check in Figma.

## What you'll see

- With one frame selected, Exploded is the only layout in the Layouts card.
- The labels sit in a free column at the side, spaced so they don't overlap.
- After a refresh, your layer list choices are still there.

## Common mistakes

- **Selecting several frames.** Exploded needs exactly one frame, component or instance.
- **Looking for Insert as layers.** Exploded is image only.
- **Using Glass on a white background.** It barely shows. Use a darker Canvas.
- **Renaming layers after curating the list.** Renamed layers lose their saved choice. Check the note and set them again.

<!-- Media to capture:
  1. Clip, 8 s, 16:10: select one app-screen frame, turn on Arrange as a layout, Exploded appears, drag Gap from 0 to 120%.
  2. Screenshot: the layer list with Show, Base and Merge ↓ buttons, and the custom grouping note.
  3. Screenshot pair: Plate style Plain and Glass on a dark Canvas.
  4. Screenshot: Labels on the right with Lines set to Corners.
  5. Clip, 5 s: Highlight stepped from 0 to 3.
-->
