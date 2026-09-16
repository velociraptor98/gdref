---
title: Move a 2D character with gravity and jump
group: movement
order: 10
summary: Side-scroller movement — walk, jump, fall.
related: [character-movement, physics-step]
---

```gdscript
extends CharacterBody2D

@export var speed: float = 300.0
@export var jump_velocity: float = -400.0

func _physics_process(delta: float) -> void:
    if not is_on_floor():
        velocity += get_gravity() * delta

    if Input.is_action_just_pressed("jump") and is_on_floor():
        velocity.y = jump_velocity

    var direction := Input.get_axis("move_left", "move_right")
    if direction:
        velocity.x = direction * speed
    else:
        velocity.x = move_toward(velocity.x, 0, speed)

    move_and_slide()
```

`get_gravity()` reads the project's gravity setting, so it stays in sync with
Project Settings > Physics. Jump velocity is **negative** because +Y is down.

Do not multiply `velocity` by `delta` — `move_and_slide()` already does.
