---
title: Detect a double tap
group: input
order: 20
summary: Fire only when an action is pressed twice in quick succession.
related: [input-button-state]
---

```gdscript
extends Node

@export var window: float = 0.25
var _last_press: float = -1.0

func _unhandled_input(event: InputEvent) -> void:
    if not event.is_action_pressed("dash"):
        return
    var now := Time.get_ticks_msec() / 1000.0
    if now - _last_press < window:
        _dash()
        _last_press = -1.0   # consume, so a triple tap isn't two dashes
    else:
        _last_press = now
```

`Time.get_ticks_msec()` is monotonic and unaffected by `Engine.time_scale`,
which is what you want for input timing even when the game is slowed down.
