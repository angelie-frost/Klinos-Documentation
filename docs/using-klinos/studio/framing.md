---
title: Framing and aspect ratios
description: Set the device's angle, the frame's shape, the device's size, and its position in the frame.
order: 2
lastUpdated: "[VERIFY: date]"
---

**Mode:** Studio

[Try this in the live demo](../reference/try-it-live.md)

Framing is two cards. The Angle card turns the device. The Frame card sets the shape of the image, how much of it the device fills, and where the device sits.

## Choose an angle

1. In the Angle card, open the preset picker.
2. Choose a preset.

**Phones and iPad Pro 11″:**

| Group | Presets |
|---|---|
| Upright | Flat, Turn left, Turn right |
| Laid back | Laid left, Laid right, Steep |

**MacBook Pro 16″:** each preset also sets the lid.

| Group | Presets |
|---|---|
| Open | Front, Hero front, Three-quarter left, Three-quarter right, From above, Side |
| Closed | Closed |

The default is Turn left. On the MacBook Pro 16″ it is Three-quarter left.

## Fine-tune the angle

- **Drag the device in the preview** to rotate it. Hold Shift to lock to one axis.
- **Turn on Adjust** under a preset to show the sliders.
- When the angle no longer matches a preset, the card shows dials instead of the preset's Adjust switch.

| Control | Range | What it does |
|---|---|---|
| Tilt back | -100 to 100 | Tips the device toward or away from you. |
| Turn | -100 to 100 | Turns it left or right. |
| Roll | -45 to 45 | Rotates it in the picture plane. |
| Perspective | 0 to 100 | How strong the perspective is. |
| Lid angle | 0° to 135° | MacBook Pro 16″ only. |

Past 90°, Tilt back and Turn show the back of the device. Your design then faces away.

## Set the frame

The Frame card sets the image's shape and the device's size in it.

1. Under the aspect ratio, pick **4:5**, **1:1**, **4:3** or **16:9**. The default is 4:5.
2. Set **Size** (40 to 100) to make the device larger or smaller in the frame. The default is 82.

## Move the device in the frame

1. In the Frame card, turn on **Position**.
2. Drag the device in the preview to move it. Hold Shift to lock to one axis.
3. To set it exactly, use the **X** and **Y** sliders (-50 to 50).
4. Click **Center** to put it back in the middle.

Offsets are a share of the frame, so they hold at every aspect ratio and size.

> **Warning**
> While Position is on, dragging the device moves it instead of rotating it. Rotate with the Angle controls, or turn Position off.

## Output size

The output size comes from the aspect ratio, the scale you pick at the bottom of the panel, and the device. Figma accepts images up to 4096 px on the longest side, so larger sizes are capped.

**Phones (and Photoreal):**

| Ratio | 1x | 2x | 4x |
|---|---|---|---|
| 4:5 | 864 × 1080 | 1728 × 2160 | 3277 × 4096 (capped) |
| 1:1 | 1080 × 1080 | 2160 × 2160 | 4096 × 4096 (capped) |
| 4:3 | 1440 × 1080 | 2880 × 2160 | 4096 × 3072 (capped) |
| 16:9 | 1920 × 1080 | 3840 × 2160 | 4094 × 2303 (capped) |

**iPad Pro 11″** exports at twice the phone base, so its display isn't a downsample of your design. At 1x: 1728 × 2160 (4:5), 2160 × 2160 (1:1), 2880 × 2160 (4:3), 3840 × 2160 (16:9). At 2x and 4x it reaches the 4096 cap.

**MacBook Pro 16″** exports at three times the phone base. At 1x: 2592 × 3240 (4:5) and 3240 × 3240 (1:1). Every other combination reaches the 4096 cap.

When a scale is capped, the status bar tells you and shows the size it used instead.

> **Tip**
> **Trim to device** in the Backdrop and shadow card crops the image to the device, so the aspect ratio no longer applies. See [Backdrop and shadow](backdrop-shadow.md).

## What you'll see

- The preset picker shows a small thumbnail of the chosen angle.
- The preview is exactly what gets inserted. It uses the same render as the export.

## Common mistakes

- **Dragging to rotate while Position is on.** With Position on, dragging moves the device instead. Use the Angle controls, or turn Position off.
- **Picking 4x for the iPad or MacBook and expecting a bigger file than 2x.** Both reach Figma's 4096 px limit at 2x.
- **Turning past 90° by accident.** The design faces away. Bring Tilt back or Turn below 90.

<!-- Media to capture:
  1. Clip, 6 s, 16:10: iPhone 17 Pro, click through Flat, Turn left, Laid left and Steep.
  2. Clip, 5 s: drag the device in the preview to rotate it, then hold Shift to lock one axis.
  3. Screenshot: the Angle card with Adjust on, showing Tilt back, Turn, Roll and Perspective.
  4. Screenshot set: the same mockup at 4:5, 1:1, 4:3 and 16:9.
  5. Screenshot: the MacBook Pro 16″ preset picker with the Open and Closed groups.
  6. Clip, 6 s: turn on Position, drag the device to the left third, then click Center.
-->
