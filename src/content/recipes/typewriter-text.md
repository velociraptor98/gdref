---
title: Typewriter dialogue text
group: ui
order: 30
summary: Reveal text one character at a time, skippable.
related: [ui-text, wait-for-seconds]
---

```gdscript
extends RichTextLabel

@export var chars_per_second: float = 40.0
var _skip := false

func show_text(content: String) -> void:
    bbcode_enabled = true
    text = content
    visible_characters = 0
    _skip = false

    while visible_characters < get_total_character_count():
        if _skip:
            visible_characters = -1     # -1 means "all"
            break
        visible_characters += 1
        await get_tree().create_timer(1.0 / chars_per_second).timeout

func _unhandled_input(event: InputEvent) -> void:
    if event.is_action_pressed("ui_accept"):
        _skip = true
```

`visible_characters` reveals text that is already laid out, so the box does not
reflow as characters appear — the reason to use it rather than appending to
`text`.

BBCode tags do not count toward `visible_characters`, so markup works normally.
