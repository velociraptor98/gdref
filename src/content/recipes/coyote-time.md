---
title: Coyote time and jump buffering
group: movement
order: 50
summary: Let players jump just after leaving a ledge, and just before landing.
related: [timers, character-movement]
---

```gdscript
extends CharacterBody2D

@export var coyote_time: float = 0.1
@export var jump_buffer: float = 0.1

var _coyote: float = 0.0
var _buffered: float = 0.0

func _physics_process(delta: float) -> void:
    _coyote = coyote_time if is_on_floor() else maxf(_coyote - delta, 0.0)

    if Input.is_action_just_pressed("jump"):
        _buffered = jump_buffer
    else:
        _buffered = maxf(_buffered - delta, 0.0)

    if _buffered > 0.0 and _coyote > 0.0:
        velocity.y = jump_velocity
        _buffered = 0.0
        _coyote = 0.0

    move_and_slide()
```

Two small timers that make a platformer feel dramatically better. Coyote time
forgives jumping a frame or two late; buffering forgives pressing a frame or
two early.
