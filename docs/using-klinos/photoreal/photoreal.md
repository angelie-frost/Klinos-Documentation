---
title: Photoreal
description: Place your design on a photographic render of a real device, front-on.
order: 8
lastUpdated: "[VERIFY: date]"
---

**Mode:** Photoreal

Photoreal puts your design on a photographic render of a real device. The device is always seen from the front. Your design is keyed into its screen.

## What's available

| Device | Finishes |
|---|---|
| iPhone 17 Pro | Cosmic Orange, Deep Blue |
| MacBook Pro 14″ | Silver |

These are separate renders, not the Studio 3D devices. The MacBook here is the 14″, while Studio has the 16″.

## Make a Photoreal mockup

1. Select a frame in Figma.
2. In Klinos, click the **Photoreal** tab.
3. In the Device card, choose the iPhone 17 Pro or the MacBook Pro 14″. For the iPhone, pick a finish.
4. In the Screen card, set **Image scale** and drag the design on the glass if you need to. See [Screen](../studio/screen.md).
5. In the Frame card, pick an aspect ratio and set **Size**. Turn on **Position** to move the device in the frame.
6. In the Backdrop and shadow card, set the **Canvas** colour and the **Ground shadow**.
7. Click **Insert mockup**.

## What still applies, and what doesn't

| Works in Photoreal | Not in Photoreal |
|---|---|
| Screen: Fill, Image scale, dragging the design | Angle: the angle is the photograph's |
| Frame: aspect ratio, Size, Position | Lighting, Staging and Match a photo |
| Backdrop: Canvas colour, Transparent background, Trim to device | Studio sweep, floor reflection and highlight |
| Ground shadow: Strength and Softness | Screen glare: the renders have no glass reflection |

The ground shadow here is a soft drop shadow traced from the device's outline. With Transparent background on, the shadow is kept, as in Studio.

## Output quality

The renders are stored larger than Figma's 4096 px image limit, so exports are never upscaled. Output sizes follow the phone table in [Framing and aspect ratios](../studio/framing.md#output-size).

## What you'll see

- The Lighting, Angle and Staging cards disappear when you switch to Photoreal.
- The device sits flat and front-on. Dragging it doesn't rotate it.
- With Position on, dragging the device moves it in the frame.
- The MacBook Pro 14″ has one finish, so no finish chips are shown for it.

## Common mistakes

- **Expecting an angle.** Each render is one front-on view. For an angled device, use Studio.
- **Looking for screen reflections.** The renders have none. If you need glass glare, use Studio.
- **Mixing up the MacBooks.** Photoreal has the MacBook Pro 14″. Studio has the MacBook Pro 16″.

> **Tip**
> New angles or new devices need new renders. Ask a maintainer if you need one.

<!-- Media to capture:
  1. Clip, 6 s, 16:10: switch from Studio to Photoreal, pick iPhone 17 Pro, switch between Cosmic Orange and Deep Blue.
  2. Screenshot: the MacBook Pro 14″ Photoreal render with a design on screen.
  3. Screenshot pair: Ground shadow at low and high Softness on the iPhone 17 Pro render.
-->
