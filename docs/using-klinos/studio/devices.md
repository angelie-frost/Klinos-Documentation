---
title: Devices and finishes
description: Choose a device and its colour in Studio, and add a polished frame or surface texture.
order: 1
lastUpdated: "[VERIFY: date]"
---

**Mode:** Studio

[Try this in the live demo](../reference/try-it-live.md)

The Device card sets which device your design sits on and what it is made of. You pick a device, a finish, and two optional extras: Polished frame and Surface texture.

## Pick a device

1. In the Device card, click the device name to open the picker.
2. Choose a device. The picker groups them like this:

| Group | Devices | Line under the name |
|---|---|---|
| iPhone | iPhone 17 Pro, iPhone 13 | 6.3″ display · 2025, 6.1″ display · 2021 |
| Android | Galaxy S26 | 6.3″ display · 2026 |
| Laptop & Tablet | MacBook Pro 16″, iPad Pro 11″ | 16.2″ display · adjustable lid, 11″ display · portrait or landscape |

You can also move through the list with the arrow keys, Home and End, or by typing the start of a name.

The default device is the iPhone 17 Pro.

## Pick a finish

Under the device, click a finish. Each device has its own set:

| Device | Finishes | Default |
|---|---|---|
| iPhone 17 Pro | Silver, Cosmic Orange, Deep Blue | Cosmic Orange |
| iPhone 13 | Midnight, Blue, Pink, Starlight | Midnight |
| Galaxy S26 | Black, Silver Shadow, Sky Blue | Black |
| MacBook Pro 16″ | Space Black, Silver | Space Black |
| iPad Pro 11″ | Space Black, Silver | Space Black |

Most finishes were colour-matched to photos of the real device. A few were not, because no photo was available: the iPhone 13's Blue and Starlight, and the Galaxy S26's Silver Shadow and Sky Blue. Those use the maker's own colour swatch with the same conversion as the matched finishes.

## Device-specific options

- **iPad Pro 11″:** turn on **Landscape** to lay it on its side.
- **MacBook Pro 16″:** set the lid in the Angle card with **Lid angle**, from 0° to 135°. See [Framing and aspect ratios](framing.md). [Match a photo](match-a-photo.md) works on every Studio device except the MacBook.

## Polished frame (phones only)

Polished frame is on the three phones only, and it is off by default. The (?) next to its switch opens the in-app guide below.

### In-app guide: Polished frame

Turns the phone's satin metal frame into a **mirror-polished** one. Instead of a soft, even sheen, the rounded edge picks up a **sharp line of light** that fades to darker tones across the curve - the look of polished steel or chrome.

#### How the shine works

![Cross-section of the rounded frame: a light at the top left reflects off the top of the curve toward the camera, making a bright line that fades around the curve](/guides/polish-frame.svg)

A mirror only shows a light where the surface faces halfway between the light and the camera. On a **rounded** edge that happens along one narrow line, so the frame gets a bright stripe with the rest of the curve falling away to dark. **Turn the phone** and the line slides around the curve, as it does on the real thing.

#### Using it

1. **Turn on Polished frame.** Existing mockups stay as they were until you do.
2. **Pick a colour.** **Match finish** polishes the frame in the phone's own finish. **Graphite**, **Pacific Blue**, **Deep Purple**, **Rose Gold** or a **custom colour** recolour the **whole body** in that metal. Picking a Finish again takes you back to Match finish.
3. **Set the Shine.**

![Shine at 0% - satin, 100% - polished (default) and 150% - brighter mirror](/guides/polish-shine.html)

Below 100% the polish fades back into the satin frame; above it the mirror gets brighter. 100% is the standard polished look.

#### Getting the best result

**Lighting:** a mirror needs lights to reflect. **Stage**, **Keynote** and **Studio White** have sharp softboxes that give crisp lines; Calibrated is softer. **Angle:** the frame has to be in view - **Turn**, **Laid** and **Steep** show the rails, a straight-on front view hides them. **Moving the lights** (Edit lights) moves the highlight line.

This is **art direction**, not a colour-matched finish: the standard finishes are fitted to photos of the real phones, the polish is styled by eye. Turning it off gives back exactly the standard finish.

## Surface texture

Surface texture works on every device and is off by default.

1. Turn on **Surface texture**.
2. Adjust **Strength** (0 to 150%). Each device starts at its own default. Click **Default** to put it back.

The (?) next to its switch opens the in-app guide below.

### In-app guide: Surface texture

Real device metal is not perfectly smooth. Bead-blasted, anodised aluminium has a fine **grain** - tiny dents that scatter light - and a faint, larger **mottle** from the anodising. Surface texture adds both, so the body reads as metal rather than plastic when you look closely.

#### What you will see

![Small mockup - a soft tooth, Large export - fine grain, Zoomed in - visible grain](/guides/grain-strip.html)

Like the real surface, the grain is smaller than a pixel at ordinary sizes: there it only takes the plastic sheen off. It resolves as you **zoom the preview** or **export at 2x or more**. It never shimmers or stair-steps - each layer of it fades out once it is finer than the render can show.

#### Strength

Each device starts at its own **default**, set to how coarse its finish is. The MacBook's 100% reproduces the grain in Apple's own MacBook Pro product shot at that shot's scale; the iPad Pro, iPhone 17 Pro, Galaxy S26 and iPhone 13 are progressively finer. Moving the slider changes only the device you are on; **Default** puts it back.

| Device | Where the texture goes |
|---|---|
| MacBook | Whole aluminium body. Default 100%. |
| iPad Pro | Whole body. Default 85%. |
| iPhone 17 Pro | Whole unibody. Default 65%. |
| Galaxy S26 | Frame and the frosted-glass back. Default 55%. |
| iPhone 13 | The aluminium frame and buttons only - its back is glossy glass. Default 45%. |

It works with every finish and with Polished frame: a polished rail stays a clean mirror while the rest of the body keeps its grain. Only the MacBook's value is anchored to a photo; the rest are art direction. Off gives back exactly the smooth finish.

## What you'll see

- The device and finish change in the preview straight away.
- On a small mockup, Surface texture only softens the plastic sheen. The grain shows when you zoom the preview or export at 2x or more.
- With Polished frame on, a bright line runs along the frame's curve and slides around it as you turn the phone.

## Common mistakes

- **Looking for Polished frame on the MacBook or iPad.** It is only on the three phones.
- **Expecting texture on a small preview.** The grain is finer than a pixel at ordinary sizes. Zoom in or export at 2x or 4x.
- **Using a polished colour for a colour-accurate mockup.** Recoloured bodies are styled by eye. Use a standard finish with Polished frame off.

<!-- Media to capture:
  1. Clip, 6 s, 16:10: open the device picker, move through the groups, pick Galaxy S26, then click through its three finishes.
  2. Screenshot: the device picker open, showing the three groups and the line under each name.
  3. Clip, 6 s: iPhone 17 Pro on Stage, Turn left. Turn on Polished frame, step Shine from 0% to 150%.
  4. Screenshot pair: MacBook Pro 16″ zoomed on the body, Surface texture off and on at 100%.
-->
