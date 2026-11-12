---
description: Compose a new light effect for a PlaiiinLight lamp from an idea
argument-hint: "<idea> [lamp]"
---

Compose a light effect for: $ARGUMENTS

Follow the compose-effect skill of this plugin step by step: pick the lamp (the last word may name
one; otherwise `lamps_list` and ask), call `lamp_form_prompt` first, write a small `shade()` script
for exactly that grid, look at an `effect_preview` before anything touches the lamp, then
`effect_validate`, `effect_compile`, `effect_upload` (show any `needsConfirmation` summary and wait
for my yes), `lamp_play`, and offer to tune its params with `effect_tunes_set`.
