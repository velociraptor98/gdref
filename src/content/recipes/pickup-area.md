---
title: Pick up an item on touch
group: physics
order: 20
summary: A coin or power-up that reacts when the player overlaps it.
related: [collision-callbacks, collision-layers]
---

Scene: `Area2D` with a `CollisionShape2D` and a `Sprite2D`.

```gdscript
extends Area2D

signal collected(value: int)

@export var value: int = 1

func _ready() -> void:
    body_entered.connect(_on_body_entered)

func _on_body_entered(body: Node2D) -> void:
    if not body.is_in_group("player"):
        return
    collected.emit(value)
    # Stop further triggers while the pickup animation plays.
    set_deferred("monitoring", false)
    var tween := create_tween()
    tween.tween_property(self, "scale", Vector2.ZERO, 0.15)
    await tween.finished
    queue_free()
```

Use `set_deferred` for `monitoring` — changing it inside a physics callback
mutates state the engine is mid-iteration over.

If the signal never fires, check that the Area's `collision_mask` includes the
layer the player is on.
