---
title: Wait, then do something
group: timing
order: 20
summary: One-off delays without a Timer node.
related: [wait-for-seconds, next-frame]
---

```gdscript
func explode() -> void:
    $AnimationPlayer.play("blink")
    await get_tree().create_timer(1.5).timeout
    if not is_instance_valid(self):
        return                       # may have been freed while waiting
    _boom()

# One frame, e.g. to let a newly added node finish _ready:
await get_tree().process_frame

# Until an animation or tween ends:
await $AnimationPlayer.animation_finished
await tween.finished
```

Always re-check validity after an `await` in code that can be freed mid-wait.
The timer holds no reference to you, so nothing keeps the node alive.

Pass `false` as the second argument to `create_timer` if the delay should
pause with the game.
