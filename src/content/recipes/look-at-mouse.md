---
title: Rotate toward the mouse
group: movement
order: 40
summary: Point a node at the cursor, instantly or smoothly.
related: [coordinate-systems]
---

```gdscript
extends Node2D

@export var turn_speed: float = 8.0

func _process(delta: float) -> void:
    var target_angle := global_position.angle_to_point(get_global_mouse_position())

    # Instant:
    # rotation = target_angle

    # Smooth, taking the shortest way around:
    rotation = lerp_angle(rotation, target_angle, 1.0 - exp(-turn_speed * delta))
```

Use `lerp_angle`, not `lerp` — plain lerp takes the long way round when the
angle wraps past π, producing a full spin.

In 3D the equivalent is `look_at(target_position, Vector3.UP)`.
