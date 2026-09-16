---
title: Saving player data
category: serialization
summary: Persist settings, progress or a save file between runs.
mappingKind: approximate
bindings:
  - engine: unity
    symbol: UnityEngine.PlayerPrefs
    signature: 'static void SetInt(string key, int value)'
    docsUrl: https://docs.unity3d.com/ScriptReference/PlayerPrefs.html
    snippet: |
      PlayerPrefs.SetInt("highScore", 4200);
      PlayerPrefs.SetFloat("volume", 0.8f);
      PlayerPrefs.Save();

      var score = PlayerPrefs.GetInt("highScore", 0);

      // Anything structured goes through JSON to a file yourself.
      File.WriteAllText(Path.Combine(Application.persistentDataPath, "save.json"),
                        JsonUtility.ToJson(_saveData));
    notes: >-
      `PlayerPrefs` handles int, float and string only, in a
      platform-specific store (registry, plist, IndexedDB). Not suitable for
      save games; `Application.persistentDataPath` plus a file is the usual
      answer there.
  - engine: godot
    symbol: ConfigFile
    signature: 'func set_value(section: String, key: String, value: Variant) -> void'
    docsUrl: https://docs.godotengine.org/en/4.4/classes/class_configfile.html#class-configfile-method-set-value
    snippet: |
      var cfg := ConfigFile.new()
      cfg.set_value("progress", "high_score", 4200)
      cfg.set_value("audio", "volume", 0.8)
      cfg.save("user://settings.cfg")

      # Reading back.
      var loaded := ConfigFile.new()
      if loaded.load("user://settings.cfg") == OK:
          var score: int = loaded.get_value("progress", "high_score", 0)
    notes: >-
      Sectioned INI-style file under `user://`. Values are `Variant`, so
      dictionaries, arrays and `Vector2` store directly without serialization
      code.
migration:
  fromUnity: >-
    `PlayerPrefs` becomes `ConfigFile`, gaining sections and losing the
    three-type limit — a `Dictionary` or `Vector2` round-trips as-is. The
    platform key/value store has no Godot equivalent; `user://` is always a real
    file, resolved to the OS's per-user app data directory. For save games,
    `Application.persistentDataPath` becomes `user://` and `JsonUtility` becomes
    `JSON.stringify`, or skip both and save a custom `Resource` with
    `ResourceSaver`.
  fromGodot: >-
    `ConfigFile` becomes `PlayerPrefs` for flat scalars, but anything structured
    needs JSON to a file under `persistentDataPath`. Budget for the
    serialization code that `Variant` was doing for you.
related:
  - scriptable-objects
  - serialized-field
---

Both engines separate "small settings" from "actual save data", and both make
the first easy and leave the second to you. The dividing line sits in a
different place.

## user:// is the important piece

Every writable path in Godot goes through `user://`, which resolves per platform
to the appropriate per-user directory — `%APPDATA%` on Windows,
`~/Library/Application Support` on macOS, `~/.local/share` on Linux. It is the
direct counterpart to `Application.persistentDataPath`.

`res://` — the project directory — is **read-only in an exported game**. Writing
there works in the editor and fails silently once shipped, which is a classic
first-shipped-build bug.

## ConfigFile does more than PlayerPrefs

`PlayerPrefs` stores three scalar types in a platform-specific store you cannot
inspect. `ConfigFile` writes a readable INI-style file with sections, and its
values are `Variant` — dictionaries, arrays, `Vector2`, nested structures all
round-trip without serialization code.

For settings, that is often the whole job. For save games it also works, though
the file is user-editable, which may or may not be what you want.

## Three options for real save data

- **`ConfigFile`** — readable, sectioned, no serialization code. Good default.
- **JSON via `FileAccess` + `JSON.stringify`** — when the format must be
  portable or consumed by something else.
- **`ResourceSaver.save()` on a custom `Resource`** — define a `SaveData`
  resource with `@export` fields and save it directly. Type-safe, versionable,
  and it reuses the same machinery as
  [shared data assets](/concepts/scriptable-objects/). Use the binary `.res`
  extension if you would rather players not edit it in a text editor.

The third has no clean Unity equivalent and is worth knowing about — it is
usually the least code of the three.
