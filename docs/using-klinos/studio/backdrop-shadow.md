---
title: Backdrop and shadow
description: Set the background, floor reflection, ground shadow, transparent background and trim.
order: 3
lastUpdated: "[VERIFY: date]"
---

**Mode:** Studio (most controls also appear in Photoreal)

The Backdrop and shadow card sets what the device stands on: the background colour, the studio sweep and its floor reflection, the ground shadow, a transparent background, and trim.

To move the device inside the frame, use Position in the Frame card. See [Framing and aspect ratios](framing.md#move-the-device-in-the-frame).

## Choose a background

1. Set the **Canvas** colour.
2. Pick **Flat fill** or **Studio sweep**. Flat fill is a solid colour. Studio sweep curves a lit floor up into a backdrop and reflects the device in it.

## Floor reflection and highlight (Studio sweep only)

- **Reflection style:** **Classic** or **Mirror**. Classic is V2's reflection, a soft silhouette darkening the floor. Mirror shows the real device mirrored in the floor, fading with height.
- **Reflection:** how strong it is, 0 to 100.
- **Floor highlight:** a pool of light on the floor. Set its **Strength**, 0 to 100.

## Ground shadow

Turn on **Ground shadow**, then set:

| Control | Range | What it does |
|---|---|---|
| Strength | 0 to 80 | How dark the shadow is. |
| Softness | 0 to 100 | How soft its edge is. |
| Contact | 0 to 100 | How dark and tight the shadow is where the device touches the floor. Higher gives a darker, tighter core. Default 88. |
| Follow key light | on or off | Takes Direction and Height from the brightest softbox in the lighting rig, and greys out those two sliders. Off by default. |
| Direction | -180° to 180° | Turns which way the shadow falls around the device. Default 16°. |
| Height | 5° to 90° | How high the light casting the shadow is. Low gives a long shadow. 90 puts it straight under the device. Default 60°. |

Contact, Follow key light, Direction and Height show in Studio only.

Staging scenes can change these values. See [Staging](staging.md).

## Transparent background and trim

**Transparent background** removes the backdrop.
- The ground shadow is kept. It is a soft, semi-transparent black on a clear background, so the exported PNG carries it.
- The studio sweep is turned off, and with it the floor reflection, the floor highlight and the Spotlight pool.

**Trim to device** crops the image to the device, so the frame's aspect ratio no longer applies. The shadow is clipped at the edges, with or without a transparent background.

> **Tip**
> Picking a lighting Look also sets the backdrop. Choose the Look first, then change the backdrop. See [Lighting](lighting.md).

## What you'll see

- The reflection and floor highlight controls only appear with Studio sweep.
- With Follow key light on, Direction and Height are greyed out.
- With Trim to device on, a note under it explains the crop.

## Common mistakes

- **Losing your backdrop by clicking a Look.** Looks bring their own backdrop. Set the backdrop after the Look.
- **Expecting a full shadow with Trim to device.** Trim clips the shadow at the image edge. Turn Trim off, or lower Height and Softness.
- **Expecting the floor reflection on a transparent background.** Transparent turns the sweep off, and the reflection with it. The shadow stays.

<!-- Media to capture:
  1. Screenshot pair: the same mockup with Flat fill and with Studio sweep.
  2. Screenshot pair: Studio sweep with Classic and with Mirror reflection.
  3. Clip, 5 s: Ground shadow on, drag Direction across its range.
  4. Clip, 4 s: turn on Follow key light, Direction and Height grey out.
  5. Screenshot: Transparent background on, shown over Figma's checkerboard, with the shadow kept.
-->
