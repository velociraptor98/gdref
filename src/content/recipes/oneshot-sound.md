---
title: Play a one-shot sound that cleans itself up
group: audio
order: 10
summary: Overlapping sound effects without a pool of player nodes.
related: [audio-playback, destroy-object]
---

```gdscript
func play_sfx(stream: AudioStream, pitch_variance: float = 0.1) -> void:
    var player := AudioStreamPlayer.new()
    player.stream = stream
    player.pitch_scale = randf_range(1.0 - pitch_variance, 1.0 + pitch_variance)
    player.bus = &"SFX"
    add_child(player)
    player.play()
    player.finished.connect(player.queue_free)
```

A Godot player plays one stream at a time, so this is the equivalent of Unity's
`PlayOneShot`. The `finished` connection frees the node when the sound ends.

The small random pitch stops repeated sounds sounding mechanical — worth it on
footsteps, hits and pickups.

For sounds fired very frequently, keep a small pool of players instead; node
creation per shot is fine for dozens per second, not thousands.
