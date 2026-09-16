---
title: Health bar above a character
group: ui
order: 10
summary: A bar that tracks a value and follows a world object.
related: [ui-layout, events-and-signals]
---

```gdscript
extends ProgressBar

@export var target: Node2D
@export var offset: Vector2 = Vector2(0, -40)

func _ready() -> void:
    show_percentage = false
    if target and target.has_signal("health_changed"):
        target.health_changed.connect(_on_health_changed)

func _process(_delta: float) -> void:
    if target:
        global_position = target.global_position + offset - size / 2.0

func _on_health_changed(current: int, maximum: int) -> void:
    max_value = maximum
    var tween := create_tween()
    tween.tween_property(self, "value", float(current), 0.2)
    modulate = Color.RED if current < maximum * 0.3 else Color.WHITE
```

For a bar that stays a constant size regardless of camera zoom, put it under a
`CanvasLayer` and convert the world position with
`get_global_transform_with_canvas()`.
