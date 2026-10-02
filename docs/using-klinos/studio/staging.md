---
title: Staging
description: Apply a ready-made scene that sets the lighting, backdrop, shadow and angle in one click.
order: 7
lastUpdated: "[VERIFY: date]"
---

**Mode:** Studio

> **Warning**
> Staging is unreleased. It is merged to main and ships in the next package, v3.16. The packaged 3.15 build doesn't have it.

The Staging card has ready-made scenes. A scene sets the Look, backdrop, shadow, angle and size for you. Every value stays editable afterwards in its own card.

## Apply a scene

1. In Studio, open the Staging card.
2. Open the scene picker. Each scene has a small preview of the whole scene.
3. Pick a scene.
4. Adjust anything you like in the other cards.

## The scenes

| Scene | What it is |
|---|---|
| None | No staging. Your lighting, backdrop, shadow and angle stay as they are. |
| Plain | Calibrated light on the plain light-grey canvas with the standard shadow. The clean starting point. |
| Floating | Lifted off a black reflective floor. The reflection and a soft, detached shadow sit below it. **Float** (0 to 40) sets the height. |
| Gradient sweep | A tinted studio sweep that brightens toward the floor under the device. The Canvas colour sets the tint. |
| Podium | Standing on a round podium in the Canvas colour, on a soft studio sweep. The Canvas colour sets the podium and backdrop. |
| Plinth | Standing on a low block with rounded edges, warm light from the left. The Canvas colour sets the block and backdrop. |
| Spotlight | A single light from above on a dark stage, a bright pool on the floor and a tight shadow. |

Spotlight uses its own Spotlight Look, which also appears in the Lighting card. See [Lighting](lighting.md).

## Podium and Plinth

- The device stands on the prop's top. Phones and the iPad stand upright, with no roll.
- These scenes turn on **Position**, so the device and prop share the frame.
- There is no mirror reflection with a prop.
- **Trim to device** includes the prop.

## Revert a scene

After you pick a scene, the Staging card shows what changed, for example "Changed Lighting, Angle, Frame and Backdrop and shadow." It lists only the cards whose values moved, and those cards pulse briefly.

Click **Revert** to put everything back as it was before the scene.

The Revert offer ends as soon as you edit any of those values, or pick another scene. It lasts for this session only.

## Multiples of one device

Scenes with several copies of the same device are planned but not built.

> **Tip**
> Pick the scene first, then fine-tune. Picking a scene overwrites the Look, backdrop, shadow and angle.

## What you'll see

- The cards a scene changed pulse once.
- The Staging card shows the scene's name and the "Changed …" note with Revert.
- With Floating, a Float slider appears.

## Common mistakes

- **Editing first, then picking a scene.** The scene overwrites your edits. Use Revert straight away if that happens.
- **Expecting Revert after more edits.** It ends as soon as you change one of the values it set.
- **Looking for a mirror floor on Podium or Plinth.** Props have no mirror reflection.

<!-- Media to capture:
  1. Clip, 8 s, 16:10: iPhone 17 Pro, open the scene picker, pick Floating, then Podium, then Spotlight.
  2. Screenshot: the scene picker with all scene thumbnails.
  3. Clip, 5 s: pick Plinth, then click Revert in the Staging card.
  4. Screenshot: Floating with Float at 40.
-->
