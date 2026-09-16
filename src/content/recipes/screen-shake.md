---
title: Screen shake
group: camera
order: 10
summary: A punchy camera shake that decays.
related: [cameras, tweening]
---

```gdscript
extends Camera2D

var _trauma: float = 0.0
@export var decay: float = 1.5
@export var max_offset: Vector2 = Vector2(24, 16)

func add_trauma(amount: float) -> void:
    _trauma = minf(_trauma + amount, 1.0)

func _process(delta: float) -> void:
    if _trauma <= 0.0:
        offset = Vector2.ZERO
        return
    _trauma = maxf(_trauma - decay * delta, 0.0)
    # Squaring makes small hits subtle and big ones dramatic.
    var shake := _trauma * _trauma
    offset = Vector2(
        max_offset.x * shake * randf_range(-1.0, 1.0),
        max_offset.y * shake * randf_range(-1.0, 1.0)
    )
```

Call `add_trauma(0.4)` on a hit. Accumulating trauma rather than setting an
intensity means several hits in quick succession stack instead of resetting.

Squaring the trauma is what makes it feel right — linear decay reads as buzzy.
