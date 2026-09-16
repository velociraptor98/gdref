---
title: Pop and squash effects
group: effects
order: 20
summary: Quick scale animations for buttons, pickups and impacts.
related: [tweening]
---

```gdscript
func pop() -> void:
    var tween := create_tween()
    tween.set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
    tween.tween_property(self, "scale", Vector2.ONE * 1.25, 0.12)
    tween.tween_property(self, "scale", Vector2.ONE, 0.10)

func squash() -> void:
    scale = Vector2(1.3, 0.7)
    var tween := create_tween()
    tween.set_trans(Tween.TRANS_ELASTIC).set_ease(Tween.EASE_OUT)
    tween.tween_property(self, "scale", Vector2.ONE, 0.4)

func fade_and_free() -> void:
    var tween := create_tween().set_parallel()
    tween.tween_property(self, "modulate:a", 0.0, 0.3)
    tween.tween_property(self, "scale", Vector2.ZERO, 0.3)
    await tween.finished
    queue_free()
```

Tweens chain sequentially by default; `set_parallel()` runs them together.

Set the node's `pivot_offset` to its centre or scaling happens from the
top-left corner.

Tweens are bound to the node that created them, so they stop and clean up
automatically when it frees.
