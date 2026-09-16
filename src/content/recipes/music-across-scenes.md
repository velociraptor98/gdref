---
title: Music that survives scene changes
group: audio
order: 20
summary: Keep a track playing across level loads, with crossfade.
related: [singletons-autoload, scene-loading]
---

Register as an autoload named `Music`:

```gdscript
extends Node

@onready var a: AudioStreamPlayer = $A
@onready var b: AudioStreamPlayer = $B
var _active: AudioStreamPlayer

func _ready() -> void:
    _active = a

func play(stream: AudioStream, fade: float = 1.0) -> void:
    if _active.stream == stream and _active.playing:
        return                                  # already playing this
    var next: AudioStreamPlayer = b if _active == a else a
    next.stream = stream
    next.volume_db = -80.0
    next.play()

    var tween := create_tween().set_parallel()
    tween.tween_property(next, "volume_db", 0.0, fade)
    tween.tween_property(_active, "volume_db", -80.0, fade)
    await tween.finished
    _active.stop()
    _active = next
```

Two players swapping roles is the standard crossfade pattern. `-80.0` dB is
silence — `0.0` is full volume, which catches everyone once.

Autoloads sit above the current scene, so `change_scene_to_file` never
interrupts them.
