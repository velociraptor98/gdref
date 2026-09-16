---
title: Playing sound
category: audio
summary: Play a sound effect or music track, positioned in the world or not.
mappingKind: direct
bindings:
  - engine: unity
    symbol: UnityEngine.AudioSource
    signature: 'void PlayOneShot(AudioClip clip, float volumeScale = 1.0f)'
    docsUrl: https://docs.unity3d.com/ScriptReference/AudioSource.PlayOneShot.html
    snippet: |
      [SerializeField] private AudioSource _source;
      [SerializeField] private AudioClip _hitSound;

      void OnHit()
      {
          _source.PlayOneShot(_hitSound);
      }
    notes: >-
      One `AudioSource` component; positional audio is the `spatialBlend`
      slider on it. Requires an `AudioListener` in the scene, normally on the
      camera. Mixing goes through AudioMixer assets.
  - engine: godot
    symbol: AudioStreamPlayer.play
    signature: 'func play(from_position: float = 0.0) -> void'
    docsUrl: https://docs.godotengine.org/en/4.4/classes/class_audiostreamplayer.html#class-audiostreamplayer-method-play
    snippet: |
      # Three node types instead of one component + a slider:
      #   AudioStreamPlayer    — non-positional (music, UI)
      #   AudioStreamPlayer2D  — positioned in 2D
      #   AudioStreamPlayer3D  — positioned in 3D, with attenuation
      @export var hit_sound: AudioStream

      func on_hit() -> void:
          $HitPlayer.stream = hit_sound
          $HitPlayer.play()
    notes: >-
      `bus` is a string naming a bus configured in the Audio bottom panel.
      Volume is in decibels (`volume_db`), not a 0–1 scale.
migration:
  fromUnity: >-
    `AudioSource` becomes one of three node types chosen up front rather than a
    `spatialBlend` slider. Two conversions to watch: volume is decibels, so
    Unity's `volume = 0.5f` is roughly `volume_db = -6.0`, and silence is
    `-80.0` rather than `0`. And `PlayOneShot` has no direct equivalent —
    overlapping sounds need either several player nodes or a short-lived node
    that frees itself on `finished`.
  fromGodot: >-
    All three node types collapse into `AudioSource` with `spatialBlend` set
    accordingly. Decibels become a 0–1 linear scale, and you will need an
    `AudioListener` in the scene, which Godot only requires for the 3D case.
related:
  - scene-loading
---

Close to a direct mapping. Both engines attach a player to a node, hand it a
clip, and route it through a named mixing channel.

## Three nodes instead of one slider

Unity uses one `AudioSource` and a `spatialBlend` value from 0 (2D) to 1 (3D).
Godot asks you to choose the node type instead:

| | Godot |
| --- | --- |
| Music, UI, narration | `AudioStreamPlayer` |
| Positioned in a 2D world | `AudioStreamPlayer2D` |
| Positioned in a 3D world | `AudioStreamPlayer3D` |

The 3D variant handles attenuation, doppler and area-based reverb. The 2D
variant pans by screen position. The plain one does neither and is the right
choice for music, where a stray spatialBlend value is a real Unity bug class.

## Decibels, not a 0–1 slider

`volume_db` is logarithmic. The conversions worth memorising:

| Linear | `volume_db` |
| --- | --- |
| 1.0 | `0.0` |
| 0.5 | `-6.0` |
| 0.25 | `-12.0` |
| 0 (silent) | `-80.0` |

Setting `volume_db = 0` does **not** mute — it is full volume. This catches
essentially everyone once. `linear_to_db()` and `db_to_linear()` exist for
slider-driven UI, and a volume slider should use them rather than mapping
linearly.

## Buses replace AudioMixer

Godot's Audio panel defines buses — Master, Music, SFX — with effects and
volume per bus. A player routes to one by name:

```gdscript
$MusicPlayer.bus = "Music"
AudioServer.set_bus_volume_db(AudioServer.get_bus_index("Music"), -6.0)
```

Functionally equivalent to AudioMixer groups, with no exposed-parameter step:
bus volumes are set directly through `AudioServer` rather than through
parameters you expose on a mixer asset first.

## No PlayOneShot

`PlayOneShot` layers several clips on one source. A Godot player plays one
stream at a time, and calling `play()` again restarts it.

For overlapping sounds, either keep a small pool of player nodes, or spawn a
player per sound and free it when done:

```gdscript
var p := AudioStreamPlayer.new()
p.stream = hit_sound
add_child(p)
p.play()
p.finished.connect(p.queue_free)
```
