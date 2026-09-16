---
title: Cooldown before an action repeats
group: timing
order: 10
summary: Rate-limit firing, dashing, or anything else.
related: [timers]
---

Add a `Timer` child, set `wait_time` and tick `One Shot`:

```gdscript
@onready var cooldown: Timer = $CooldownTimer

func try_fire() -> void:
    if not cooldown.is_stopped():
        return
    _fire()
    cooldown.start()

# Progress for a UI indicator, 0..1:
func cooldown_progress() -> float:
    if cooldown.is_stopped():
        return 1.0
    return 1.0 - (cooldown.time_left / cooldown.wait_time)
```

The timer holds the state, so there is no countdown variable to decrement in
`_process`, and it pauses with the tree automatically.
