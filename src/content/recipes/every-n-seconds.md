---
title: Do something every N seconds
group: timing
order: 30
summary: A repeating tick — spawning waves, regenerating health.
related: [timers]
---

With a `Timer` node (`One Shot` off, `Autostart` on):

```gdscript
func _ready() -> void:
    $SpawnTimer.timeout.connect(_spawn_wave)
```

Or entirely in code, with no node:

```gdscript
func _ready() -> void:
    _spawn_loop()

func _spawn_loop() -> void:
    while is_inside_tree():
        await get_tree().create_timer(2.0).timeout
        _spawn_wave()
```

The loop form reads well for sequences with varying delays. `is_inside_tree()`
ends it when the node is removed — without that check it runs forever.
