---
title: Knock a character back on hit
group: physics
order: 30
summary: Apply an impulse away from the damage source, decaying over time.
related: [character-movement, rigidbody-physics]
---

```gdscript
extends CharacterBody2D

@export var knockback_decay: float = 8.0
var _knockback: Vector2 = Vector2.ZERO

func take_hit(from: Vector2, force: float = 300.0) -> void:
    _knockback = global_position.direction_to(from) * -force

func _physics_process(delta: float) -> void:
    _knockback = _knockback.move_toward(Vector2.ZERO, knockback_decay * 100.0 * delta)
    velocity = _input_velocity() + _knockback
    move_and_slide()
```

Keeping knockback in its own vector and adding it to intentional movement means
the player is not fully locked out of control while it decays — usually feels
better than overwriting `velocity` outright.
