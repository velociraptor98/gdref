---
title: Volume sliders that work
group: data
order: 20
summary: Wire a UI slider to an audio bus without the volume feeling wrong.
related: [audio-playback, persistent-data]
---

```gdscript
extends HSlider

@export var bus_name: StringName = &"Music"
var _bus: int

func _ready() -> void:
    _bus = AudioServer.get_bus_index(bus_name)
    min_value = 0.0
    max_value = 1.0
    step = 0.01
    value = db_to_linear(AudioServer.get_bus_volume_db(_bus))
    value_changed.connect(_on_changed)

func _on_changed(v: float) -> void:
    AudioServer.set_bus_volume_db(_bus, linear_to_db(v))
    AudioServer.set_bus_mute(_bus, is_zero_approx(v))
```

The `linear_to_db` conversion is the whole point. Mapping a 0–1 slider straight
onto `volume_db` gives you a control that does nothing for most of its travel
and then cuts out.

Mute at zero because `linear_to_db(0)` is `-inf`.
