---
title: Change scene with a fade
group: scene
order: 30
summary: Fade to black, swap scenes, fade back in.
related: [scene-loading, singletons-autoload]
---

Register this as an autoload named `Transition`:

```gdscript
extends CanvasLayer

@onready var rect: ColorRect = $ColorRect

func _ready() -> void:
    layer = 128                       # above everything
    rect.color = Color(0, 0, 0, 0)
    rect.mouse_filter = Control.MOUSE_FILTER_IGNORE

func change_scene(path: String, duration: float = 0.3) -> void:
    rect.mouse_filter = Control.MOUSE_FILTER_STOP   # block clicks mid-fade
    var tween := create_tween()
    tween.tween_property(rect, "color:a", 1.0, duration)
    await tween.finished

    get_tree().change_scene_to_file(path)
    await get_tree().process_frame            # let the new scene build

    tween = create_tween()
    tween.tween_property(rect, "color:a", 0.0, duration)
    await tween.finished
    rect.mouse_filter = Control.MOUSE_FILTER_IGNORE
```

Call it with `Transition.change_scene("res://levels/level_02.tscn")`.

`"color:a"` tweens a single component of a property — no need for a custom
method to animate just the alpha.
