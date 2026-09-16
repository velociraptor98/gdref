---
title: Top-down 8-way movement
group: movement
order: 20
summary: Move in any direction with no gravity, normalized so diagonals aren't faster.
related: [input-read-vector, character-movement]
---

```gdscript
extends CharacterBody2D

@export var speed: float = 300.0

func _physics_process(_delta: float) -> void:
    var direction := Input.get_vector("move_left", "move_right", "move_up", "move_down")
    velocity = direction * speed
    move_and_slide()
```

`get_vector()` normalizes for you, so holding two keys does not give you
1.41× speed — the bug you get from building the vector by hand.
