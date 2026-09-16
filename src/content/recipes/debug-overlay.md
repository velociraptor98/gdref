---
title: Debug overlay
group: debug
order: 10
summary: FPS and live values on screen, debug builds only.
related: [logging-and-debug, singletons-autoload]
---

Register as an autoload named `Debug`:

```gdscript
extends CanvasLayer

var _values: Dictionary = {}
@onready var label: Label = $Label

func _ready() -> void:
    layer = 127
    visible = OS.is_debug_build()

func track(key: String, value: Variant) -> void:
    _values[key] = value

func _process(_delta: float) -> void:
    if not visible:
        return
    var lines := ["FPS  %d" % Engine.get_frames_per_second()]
    for key in _values:
        lines.append("%s  %s" % [key, _values[key]])
    label.text = "\n".join(lines)

func _unhandled_input(event: InputEvent) -> void:
    if event is InputEventKey and event.pressed and event.keycode == KEY_F3:
        visible = not visible
```

Call `Debug.track("velocity", velocity)` from anywhere. Because it is an
autoload it survives scene changes, and `OS.is_debug_build()` keeps it out of
release.

Before writing anything custom, check **Debug > Visible Collision Shapes** and
**Visible Navigation** in the editor — they cover the most common cases for
free.
