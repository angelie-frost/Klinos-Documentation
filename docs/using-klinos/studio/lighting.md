---
title: Lighting
description: Pick a Look, check the highlights, and fine-tune the lights in Studio mode.
order: 4
lastUpdated: "[VERIFY: date]"
---

**Mode:** Studio

[Try this in the live demo](../reference/try-it-live.md)

The Lighting card sets how the device is lit. You pick a Look, check it against a neutral background, and fine-tune the lights if you need to.

## How lighting works

The device is lit by up to six softboxes, which are flat, rectangular lights, plus a soft ambient glow from the whole studio. What you see on the device are their reflections. Moving a light changes where the highlights fall on the glass and metal.

A Look is a ready-made set of these lights. Calibrated is the default. It is V2's colour-matched studio, and the device finishes were fitted under it.

## Light a mockup

1. **Pick a Look.** In the Lighting card, click a Look. Hover a Look to read what it is for. Picking a Look also sets the backdrop: its colour, sweep and reflection.
2. **Check it against a neutral background.** Under **Preview background**, choose Grey or Dark to judge the highlights. Choose Output to see exactly what Insert, Export and Copy produce. This setting is preview only and never exported.
3. **See where the lights are.** Turn on **Reference spheres**. A chrome ball mirrors every light's position and shape, and a grey ball shows the overall direction. They are never exported.
4. **Set the brightness.** **Brightness** scales the whole rig without moving any light. 100% on Calibrated is V2's colour-matched lighting. The top of the slider is 110% on the iPhone 13, MacBook Pro 16″ and iPad Pro 11″, and 105% on the iPhone 17 Pro and Galaxy S26.
5. **Fine-tune, if you need to.** Open **Edit lights** to move, add or change individual lights. See [Edit the lights](#edit-the-lights).

> **Tip**
> For colour-accurate finishes, use Calibrated at 100% brightness. The finishes were fitted under that light, so every other Look is art direction.

> **Note**
> **Preview background** sits at the foot of the Lighting card. It used to be called **Preview scene**, which is the name in the packaged 3.15 build. The options are the same four: Output, Grey, Dark and Lights.

## The Looks

| Look | What it is |
|---|---|
| Calibrated | V2's colour-matched studio. The finishes were fitted under this light. |
| Stage | Black stage, a soft overhead key and tall strip lights raking the rails. The Pro product-page look. |
| Studio White | Bright seamless white, a big overhead diffuser and narrow side strips for crisp edges. |
| Warm | A low warm key from the left and a cool rim from behind. Late-afternoon studio. |
| Keynote | Graphite stage built around the laptop: a big soft overhead, a low rake that picks out the keys and ports, a cool rim along the lid, and almost nothing on the glass. |
| Spotlight | One narrow light from above on a near-black stage, a faint rim behind and just enough front light to read the glass. |

> **Warning**
> Picking a Look replaces your backdrop colour, sweep and reflection with the Look's own. Set the Look first, then adjust the backdrop.

## Edit the lights

Open **Edit lights**. Its summary shows how many lights are on and which Look you are on. Inside you get a plot, a list and the controls for the selected light. While Edit lights is open, the (?) button next to it opens the in-app guide, "How lighting works".

## In-app guide: How lighting works

This is the guide the (?) next to **Edit lights** opens in the panel.

The device is lit by up to **six softboxes** - flat, rectangular lights - plus a soft **ambient** glow from the whole studio. What you see on the device are their **reflections**: a light shows where its reflection lands on the glass and metal, so moving it changes where the highlights fall.

### The plot

![The light plot seen from above: the camera at the bottom, overhead at the centre, the horizon at the edge](/guides/lighting-plot.svg)

You are looking down from above. The camera is at the bottom and **behind** is at the top. Each dot is a light: its colour is the light's colour, its size the light's size. **Drag a dot** to move that light: going around the circle changes **Around**; going from the edge to the centre raises it, from level at the rim to straight overhead in the middle.

### The list

Click a light to select it; the controls below then edit that light. **Add** creates a new one (up to six), **Remove** deletes the selected one, and **Reset** puts the chosen Look's lights back. Editing any light turns the Look into **Custom**.

### Controls for the selected light

| Control | What it does |
|---|---|
| On | Switch the light off without losing its settings. |
| Around | Where it sits around the device, in degrees. 0 is beside the camera, ±90 is to the right or left, 180 is behind. |
| Height | How high it is. 0 is level with the device, 90 is straight overhead; below 0 it lights from underneath. |
| Width | How wide the softbox is. Bigger lights give broader, gentler highlights. |
| Length | How tall the softbox is. Long, thin lights make the strip highlights you see along the rails. |
| Intensity | How bright this light is, independent of the others. |
| Softness | How gradually its edge fades. Low gives a crisp-edged reflection, high a diffuse glow. |
| Colour | The light's tint - warm, cool or anything else. |
| Ambient | The soft light from the whole studio at once. It sets how dark the unlit parts of the device get. |

### Seeing the lights

**Preview background** above changes only what is behind the device in the preview: **Grey** and **Dark** make highlights easy to judge, and **Lights** draws the rig itself around the device, with the camera side in the middle. **Reference spheres** adds a chrome ball, which mirrors every light's position and shape, and a grey ball, which shows the overall direction. Neither is ever exported. **Brightness** scales every light at once without moving any.

## What you'll see

- The Look you picked is highlighted in the Lighting card. After you edit a light, a Custom chip appears and the card notes "custom rig".
- The Edit lights summary reads, for example, "4 lights · Calibrated".
- Grey, Dark and Lights change only the preview. Insert, Export and Copy still use your Backdrop settings.

## Common mistakes

- **Judging highlights on a busy backdrop.** Switch Preview background to Grey or Dark first.
- **Expecting Grey, Dark or Lights in the export.** They are preview only. Output shows what you will get.
- **Losing a custom backdrop by clicking a Look afterwards.** Pick the Look first.

## For maintainers: how a Look is defined

Looks live in `LOOKS` in `src/ui.html`. A Look is always art direction. The Calibrated rig is measured and must not be edited by eye.

```js
warm: {
  label: 'Warm',
  about: 'A low warm key from the left and a cool rim from behind - late-afternoon studio.',
  rig: {
    ambLo: [0.050, 0.042, 0.036], ambHi: [0.150, 0.132, 0.112], amb: 1,
    boxes: [
      fromAngles('Warm key', -52, 26, 0.62, 0.62, [1.00, 0.84, 0.64], 5.8, 0.45),
      fromAngles('Cool rim', 138, 20, 0.16, 0.95, [0.70, 0.80, 1.00], 5.0, 0.22),
      fromAngles('Top',        0, 80, 0.80, 0.80, [1.00, 0.95, 0.90], 1.4, 0.60)
    ]
  },
  // a Look also carries its backdrop
  backdrop: { bg: '#e8dfd3', bgMode: 'sweep', reflectStyle: 'mirror', reflect: 28, highlight: true, highlightStrength: 80 }
}
```

<!-- Media to capture:
  1. Clip, 6 s, 16:10: iPhone 17 Pro, Cosmic Orange, default angle. Click each Look in order (Calibrated, Stage, Studio White, Warm, Keynote), about 1 s each.
  2. Screenshot: Preview background set to Lights, Reference spheres on.
  3. Clip, 5 s: Edit lights open, drag the Key light's dot around the plot.
  4. Screenshot: the "How lighting works" dialog.
-->
