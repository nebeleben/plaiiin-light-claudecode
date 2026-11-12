---
description: Show my PlaiiinLight lamps — state, access and firmware at a glance
---

Show my lamps: call `lamps_list` and `swarms_list` (both read-only), then summarise as one table
with the columns **name**, **on/off**, **mode / effect / scene**, **access**, **firmware**.

- on/off: from `state.on`; an offline lamp shows "offline" plus its reason.
- mode / effect / scene: `state.mode`, the running effect (`state.current` or `currentScript`) and
  the active `state.scene`, whichever apply.
- access: `role`; for `ai` keys list the granted `perms` (and the brightness cap if set).
- firmware: `firmware`.

Below the table, one line per swarm with its members (from `swarms_list`); mention lamps whose swarm
membership is `unknown` only briefly. If the fleet is empty, suggest `lamps_discover`. Never print
keys or share links. Don't change anything.
