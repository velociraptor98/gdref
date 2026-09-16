---
title: Pause menu
group: ui
order: 20
summary: Freeze the game, show a menu, resume.
related: [enable-disable, ui-events]
---

Put the menu under a `CanvasLayer` and set its **Process Mode** to `When Paused`:

```gdscript
extends CanvasLayer

func _ready() -> void:
    hide()
    process_mode = Node.PROCESS_MODE_WHEN_PAUSED
    $Panel/ResumeButton.pressed.connect(_resume)

func _unhandled_input(event: InputEvent) -> void:
    if event.is_action_pressed("ui_cancel"):
        _toggle()
        get_viewport().set_input_as_handled()

func _toggle() -> void:
    var paused := not get_tree().paused
    get_tree().paused = paused
    visible = paused
    if paused:
        $Panel/ResumeButton.grab_focus()

func _resume() -> void:
    get_tree().paused = false
    hide()
```

`get_tree().paused` stops every node whose process mode is `Pausable` (the
default). Only nodes marked `When Paused` or `Always` keep running — which is
why the menu itself must be marked, or its buttons will not respond.

`grab_focus()` makes the menu keyboard- and gamepad-navigable immediately.
