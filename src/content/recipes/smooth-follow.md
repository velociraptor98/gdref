---
title: Smoothly follow a target
group: movement
order: 30
summary: Ease toward a position instead of snapping to it.
related: [math-and-vectors]
---

```gdscript
extends Node2D

@export var target: Node2D
@export var smoothing: float = 5.0

func _process(delta: float) -> void:
    if target == null:
        return
    # Frame-rate independent exponential smoothing.
    var weight := 1.0 - exp(-smoothing * delta)
    global_position = global_position.lerp(target.global_position, weight)
```

The naive `lerp(a, b, 0.1)` every frame is frame-rate dependent — faster
machines converge faster. The `1.0 - exp(-k * delta)` form fixes that and costs
nothing.
