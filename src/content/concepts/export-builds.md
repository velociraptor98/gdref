---
title: Exporting and builds
category: assets
summary: Turning the project into a shippable build for each platform.
mappingKind: approximate
bindings:
  - engine: unity
    symbol: UnityEditor.BuildPipeline
    signature: 'static BuildReport BuildPlayer(BuildPlayerOptions options)'
    docsUrl: https://docs.unity3d.com/ScriptReference/BuildPipeline.BuildPlayer.html
    snippet: |
      // File > Build Settings, or scripted:
      BuildPipeline.BuildPlayer(new BuildPlayerOptions {
          scenes = new[] { "Assets/Scenes/Main.unity" },
          locationPathName = "Build/Game.exe",
          target = BuildTarget.StandaloneWindows64,
      });

      // Conditional compilation.
      #if UNITY_EDITOR
      #endif
    notes: >-
      Scenes must be registered in Build Settings. Platform modules are
      installed through Unity Hub.
  - engine: godot
    symbol: OS.has_feature
    signature: 'func has_feature(tag_name: String) -> bool'
    docsUrl: https://docs.godotengine.org/en/4.4/tutorials/export/exporting_projects.html
    snippet: |
      # Project > Export, with presets stored in export_presets.cfg.
      # Headless: godot --headless --export-release "Windows Desktop" build/game.exe

      if OS.has_feature("editor"):
          print("running in the editor")
      if OS.has_feature("web"):
          _use_web_fallback()

      if OS.is_debug_build():
          _enable_cheats()
    notes: >-
      Export presets are per-project config committed with the repo. Export
      templates are a one-time download per engine version.
migration:
  fromUnity: >-
    Build Settings becomes Export Presets, and the scene registry disappears —
    any scene can be the main scene, and everything under `res://` is included
    unless a preset filter excludes it. There is no `#if UNITY_EDITOR`
    preprocessor: GDScript has no conditional compilation, so editor-only code
    uses `Engine.is_editor_hint()` and platform branches use `OS.has_feature()`
    at runtime. Platform modules become export templates, downloaded once per
    engine version rather than per project.
  fromGodot: >-
    Export presets become Build Settings plus per-platform Player Settings, and
    every scene you intend to load must be registered. Runtime `OS.has_feature`
    checks become compile-time `#if` directives, which strip the code rather than
    branching around it.
related:
  - persistent-data
  - scene-loading
  - load-resource
---

Both engines produce per-platform builds from a configuration screen. Godot's is
lighter, and the differences are mostly about what is decided when.

## Export templates, once per version

Before the first export, download export templates (Editor > Manage Export
Templates) — prebuilt engine binaries for every platform, matching your engine
version exactly.

Unlike Unity's per-platform modules, this is one download covering all targets,
and it is per *engine version* rather than per project. The version match is
strict: a 4.4 project needs 4.4 templates.

## Presets are committed config

`export_presets.cfg` sits in the project root and belongs in version control. It
holds each target's settings, file filters and platform options, so a teammate
cloning the repo can export without reconfiguring.

The one thing to keep out of it is signing credentials — keystore passwords and
API keys should come from environment variables or a local override, since the
file is plain text.

## No conditional compilation

GDScript has no preprocessor. The `#if UNITY_EDITOR` pattern has no counterpart,
and the substitutes are runtime checks:

| Need | Godot |
| --- | --- |
| Editor only | `Engine.is_editor_hint()` |
| Debug build | `OS.is_debug_build()` |
| Platform | `OS.has_feature("web")`, `"android"`, `"windows"` … |
| Custom flag | a custom feature tag on the export preset |

These branch at runtime rather than stripping code, so debug-only code ships in
the binary unless you exclude the file in the preset's filters. For most projects
that is fine; for anything sensitive, keep it in files excluded by the preset.

Custom feature tags are the flexible piece — define `demo` on one preset and
branch on `OS.has_feature("demo")` to build a demo variant from the same project.

## Headless export for CI

```sh
godot --headless --export-release "Windows Desktop" build/game.exe
```

The preset name is the one from the export dialog. This needs the editor binary
(not the template) and the templates installed, which makes CI straightforward —
the official container images bundle both.

`--export-debug` produces a debug build with the remote debugger enabled.

## Where builds write files

A shipped game cannot write to `res://`. Everything persistent goes to `user://`,
as covered in [saving player data](/concepts/persistent-data/). This works in the
editor too, so the failure mode is not "it breaks on export" but "it silently
wrote somewhere else" — worth testing an actual export before shipping.
