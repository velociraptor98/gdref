---
title: Save and load the game
group: data
order: 10
summary: Persist progress and settings to a real file.
related: [persistent-data, scriptable-objects]
---

```gdscript
const SAVE_PATH := "user://save.cfg"

func save_game() -> void:
    var cfg := ConfigFile.new()
    cfg.set_value("progress", "level", current_level)
    cfg.set_value("progress", "score", score)
    cfg.set_value("progress", "unlocked", unlocked_ids)   # Array works as-is
    cfg.set_value("player", "position", player.global_position)  # so does Vector2
    cfg.save(SAVE_PATH)

func load_game() -> bool:
    var cfg := ConfigFile.new()
    if cfg.load(SAVE_PATH) != OK:
        return false
    current_level = cfg.get_value("progress", "level", 1)
    score = cfg.get_value("progress", "score", 0)
    unlocked_ids = cfg.get_value("progress", "unlocked", [])
    return true
```

`user://` resolves to the OS's per-user app data directory. **`res://` is
read-only in an exported game** — writing there works in the editor and fails
silently once shipped.

Values are `Variant`, so arrays, dictionaries and `Vector2` round-trip without
serialization code. Always pass a default to `get_value` so a save from an older
version still loads.
