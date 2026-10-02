---
title: Layouts
description: Arrange several layers as an Arc, Cover flow, Fan, Cylinder, Tunnel or Stack.
order: 10
lastUpdated: "[VERIFY: date]"
---

**Mode:** Playground

[Try this in the live demo](../reference/try-it-live.md). Use an image stands in for your Figma layers there, and Insert as layers needs Figma.

Select two or more layers and Klinos can arrange them as one picture: along an arc, as a cover flow, a fan, a cylinder, a tunnel or a stack. Each layer becomes one card.

## Arrange your layers

1. **Select two or more layers** in Figma.
2. In the Layouts card, turn on **Arrange as a layout**.
3. **Pick a layout.** Klinos sets the Angle card to suit it. You can still change the angle.
4. **Shape it** with the layout's sliders.
5. **Set the order** in the Selection card if you need to.
6. Click **Insert image**, or **Insert as layers** for Arc, Fan and Stack when the view is flat. See [Insert image vs Insert as layers](insert.md).

Size and Position in the Angle card move the whole arrangement. The image stays the size of all the selected layers together.

## The layouts

### Arc

The cards sit along a curve in the picture plane, spaced edge to edge, each rolled to follow the curve. The default view is flat.

| Setting | Range | Default | What it does |
|---|---|---|---|
| Arc angle | 30° to 330° | 200° | How much of a circle the cards cover. |
| Spacing | 0 to 100% | 40% | The gap between cards. |
| Follow curve | 0 to 100% | 35% | How much each card rolls with the curve. |
| Direction | Rainbow or Smile | Rainbow | Curves up or down. |

Use it for a row of screens with a gentle sweep.

### Cover flow

One card faces you. The others step out to the sides and back, turned so their inner edge is the nearer one. The default Perspective is 45.

| Setting | Range | Default | What it does |
|---|---|---|---|
| Focus card | 0 up to the number of cards | 0 | Which card faces you. |
| Side angle | 0° to 85° | 55° | How far the side cards turn. |
| Spacing | 5 to 150% | 75% | How far apart the side cards are. |
| Centre gap | 0 to 100% | 25% | The space on each side of the focus card. |
| Depth | 0 to 150% | 60% | How far back the side cards sit. |
| Depth dim | 0 to 100% | 25% | Darkens cards with distance. |

Use it to feature one screen with the rest around it.

A Cover flow update lets the side cards overlap the focus card. Centre gap goes negative, down to -75%. The Focus card becomes a number field with a **Middle** option, and you can click a card in the preview to focus it.

### Fan

The cards spread from one pivot point below them, like a hand of cards. The default view is flat.

| Setting | Range | Default | What it does |
|---|---|---|---|
| Fan angle | 5° to 180° | 60° | How wide the fan opens. |
| Pivot | 30 to 400% | 150% | How far below the cards the pivot sits. |
| Lift centre | 0 to 60% | 0% | Raises the middle cards. |
| On top | Centre, Left or Right | Centre | Which card is in front. |

Use it for a compact group that still shows every card.

### Cylinder

The cards wrap around a vertical axis, facing out. The default view is tilted -12 with Perspective 40.

| Setting | Range | Default | What it does |
|---|---|---|---|
| Coverage | 60° to 360° | 180° | How much of the cylinder the cards cover. |
| Gap | 0 to 100% | 12% | The space between cards. |
| Spin | -180° to 180° | 0° | Turns the cylinder. |
| Depth dim | 0 to 100% | 20% | Darkens cards with distance. |
| Back cards | Show, Dim or Hide | Dim | What happens to cards on the far side. |

Use it for a carousel of many screens.

### Tunnel

The cards line a tube that runs away from the camera, in rings. The first card is on the floor. The default Perspective is 70.

| Setting | Range | Default | What it does |
|---|---|---|---|
| Cards per ring | 3 to 8 | 4 | How many cards make one ring. |
| Gap | 0 to 100% | 10% | The space between cards. |
| Ring depth | 50 to 300% | 110% | How far apart the rings are. |
| Twist | -45° to 45° | 15° | Turns each ring a little more than the last. |
| Depth fade | 0 to 100% | 60% | Fades cards with distance. |

Use it for a dramatic, deep arrangement of many screens.

### Stack

A deck of cards stepped in one direction and back in depth. The default view is Tilt -6, Turn -22, Perspective 30.

| Setting | Range | Default | What it does |
|---|---|---|---|
| Direction | → ← ↑ ↓ and the four diagonals | → | Which way the deck steps. |
| Sideways | 0 to 100% | 30% | Step to the side, as a share of the card width. |
| Up/down | 0 to 60% | 18% | Step up or down, as a share of the card height. |
| Depth step | 0 to 150% | 34% | Step back in depth. |
| Rotate each | -10° to 10° | 0° | Turns each card a little more than the one before. |
| On top | First or Last | First | Which card is in front. |
| Depth dim | 0 to 100% | 32% | Darkens cards with distance. |
| Depth fade | 0 to 100% | 0% | Fades cards with distance. Cards behind then show through. |
| Card shadows | On or Off | On | A shadow under each card, falling on the cards behind. |
| Strength, Softness, Distance | 0–80, 0–100, 0–100 | 28%, 40%, 30% | How the card shadows look. |

Use it for a cascade of screens, or several states of one screen.

## Order, equal heights and repeat

- **Order** in the Selection card: Left to right, Top to bottom, Layers (the Layers panel, top first) or Custom.
- **Drag a row's grip**, or press Alt+Up or Alt+Down on it, to reorder. The order becomes Custom.
- **Equal heights** scales the cards to the same height.
- **Repeat to** (0 to 48) fills more slots by cycling through your layers.

Up to 24 layers are used. Depth dim leans a card toward the Canvas colour, or black on a transparent background. Depth fade lowers its opacity.

## Reset a layout

- **Reset layout**, above the layout's sliders, puts this layout's settings back to their defaults. "Layout reset · Undo" appears in the status bar for 10 seconds.
- **Double-click a slider's name or value** to reset only that slider.

Nothing else changes. See [Playground guide and Reset layout](guide-reset.md).

## What you'll see

- The image is the size of all the selected layers together, placed 80 px to the right of them.
- Picking a layout changes the Angle card to that layout's view.
- With one frame selected, the only layout offered is Exploded. See [Exploded layers](exploded.md).

> **Tip**
> Arc, Fan and Stack can go in as editable Figma layers when Perspective, Tilt and Turn are all 0.

## Common mistakes

- **Selecting one layer and looking for layouts.** Layouts need two or more layers. One frame gives Exploded.
- **Expecting a fixed order.** Reading order is the default. Use Order, or drag rows, to set it.
- **Turning on Depth fade in Stack.** The cards behind show through. Use Depth dim instead.
- **Selecting more than 24 layers.** Only 24 are arranged.

<!-- Media to capture:
  1. Clip, 8 s, 16:10: five app screens selected, Arrange as a layout on, click through Arc, Cover flow, Fan, Cylinder, Tunnel and Stack.
  2. Screenshot for each layout at its defaults, same five screens.
  3. Clip, 5 s: drag a row's grip in the Selection card to change the order.
  4. Clip, 6 s: change Fan angle, click Reset layout, then click Undo in the status bar.
-->
