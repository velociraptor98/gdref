---
title: Let the player rebind a key
group: input
order: 10
summary: Capture the next key pressed and reassign an input action to it.
related: [input-actions, input-event-propagation]
---

```gdscript
extends Button

@export var action: StringName = &"jump"
var _listening := false

func _ready() -> void:
    _refresh()
    pressed.connect(func() -> void:
        _listening = true
        text = "Press any key…"
    )

func _input(event: InputEvent) -> void:
    if not _listening:
        return
    if event is InputEventKey and event.pressed:
        InputMap.action_erase_events(action)
        InputMap.action_add_event(action, event)
        _listening = false
        _refresh()
        get_viewport().set_input_as_handled()

func _refresh() -> void:
    var events := InputMap.action_get_events(action)
    text = events[0].as_text() if not events.is_empty() else "Unbound"
```

`InputMap` changes are runtime-only — they reset on restart. Persist them
alongside your other settings, as in the save recipe below.
