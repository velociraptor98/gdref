---
title: Editor scripting
category: editor
summary: Running code in the editor, custom inspectors, and extending the editor itself.
mappingKind: approximate
bindings:
  - engine: unity
    symbol: UnityEngine.ExecuteInEditMode
    signature: '[ExecuteAlways]'
    docsUrl: https://docs.unity3d.com/ScriptReference/ExecuteAlways.html
    snippet: |
      [ExecuteAlways]
      public class Fence : MonoBehaviour
      {
          [SerializeField] private int _segments = 5;
          void Update() { if (!Application.isPlaying) Rebuild(); }
      }

      // Custom inspector — must live in an Editor/ folder.
      [CustomEditor(typeof(Fence))]
      public class FenceEditor : Editor
      {
          public override void OnInspectorGUI() { /* IMGUI */ }
      }
    notes: >-
      Editor code must sit in an `Editor/` folder or an editor-only assembly, or
      builds fail. Custom inspectors are written in IMGUI or UI Toolkit.
  - engine: godot
    symbol: '@tool'
    signature: '@tool'
    docsUrl: https://docs.godotengine.org/en/4.4/tutorials/plugins/running_code_in_the_editor.html
    snippet: |
      @tool
      extends Node2D

      @export var segments: int = 5:
          set(value):
              segments = value
              if Engine.is_editor_hint():
                  _rebuild()

      # Custom inspector: an EditorPlugin + EditorInspectorPlugin,
      # enabled per project in Project Settings > Plugins.
    notes: >-
      `@tool` at the top of a script makes it run in the editor. No separate
      folder, no separate assembly — the same script runs in both contexts.
migration:
  fromUnity: >-
    `[ExecuteAlways]` becomes `@tool`, and `Application.isPlaying` becomes
    `Engine.is_editor_hint()` (note the inverted sense — it is true *in* the
    editor). The folder rule disappears: tool scripts live anywhere. The tradeoff
    is that a `@tool` script's errors can affect the editor itself, and an
    infinite loop will hang it — Unity's separation makes that harder to do.
    Custom inspectors are a bigger step up in Godot: a full `EditorPlugin`
    rather than a `[CustomEditor]` attribute.
  fromGodot: >-
    `@tool` becomes `[ExecuteAlways]`, and editor-only code must move into an
    `Editor/` folder. `_get_property_list` has no direct equivalent — dynamic
    inspector fields become a custom inspector class.
related:
  - serialized-field
  - logging-and-debug
  - scriptable-objects
---

Godot makes running code in the editor trivially easy, and makes deeply
customising the editor somewhat harder.

## @tool is one line

```gdscript
@tool
extends Node2D
```

That is the whole mechanism. The script now runs in the editor as well as at
runtime. There is no `Editor/` folder convention and no assembly split, because
Godot's editor is a Godot application running your scene.

Guard anything that should not run at edit time:

```gdscript
if Engine.is_editor_hint():
    return   # skip gameplay logic in the editor
```

The name is worth reading carefully — `is_editor_hint()` is **true in the
editor**, the opposite polarity to `Application.isPlaying`.

## Two real cautions

**A tool script can hang the editor.** It runs in the editor's process, so an
infinite loop in `_process` freezes the application. Unity's assembly separation
makes this harder to achieve.

**`_ready` and `_process` run at edit time.** Node references may be null while
the scene is being constructed, and `_process` running in the editor will happily
consume CPU. Guard both.

## Property setters do the work

The common Unity pattern — `[ExecuteAlways]` plus a rebuild in `Update` — usually
becomes a property setter instead:

```gdscript
@export var segments: int = 5:
    set(value):
        segments = value
        _rebuild()
```

The setter fires when the value changes in the inspector, so there is no polling
and no per-frame cost. This covers most procedural-geometry and layout-helper
cases without `_process` running at all.

## Dynamic inspectors without a plugin

Two virtuals get you a long way before you need an `EditorPlugin`:

- **`_get_property_list()`** — add properties that do not exist as fields,
  including dynamic ones, with full control over hints and grouping.
- **`_validate_property(property)`** — hide or change a property based on state,
  so a "shape" enum can show only the fields relevant to the current selection.

Together these cover a good share of what `[CustomEditor]` is typically used for,
without leaving the node's own script.

## Full plugins

For genuine editor extension — new docks, custom gizmos, import plugins, new
inspector widgets — the path is an `EditorPlugin`:

```
addons/my_plugin/
  plugin.cfg
  plugin.gd      # extends EditorPlugin
```

Enable it in Project Settings > Plugins. `EditorPlugin` gives you
`add_control_to_dock`, `add_inspector_plugin`, `add_import_plugin` and
`add_node_3d_gizmo_plugin`.

This is more ceremony than Unity's attribute-driven approach for a simple custom
inspector. It is also more capable at the top end — plugins are distributed as
plain folders and installed by copying, with no package manifest.

## Handy editor-time bits

- **`@icon("res://icon.svg")`** — a custom icon for your class in the scene dock.
- **`@export_tool_button`** — an inspector button that calls a method.
- **`EditorInterface`** — reach the editor's own state from a tool script.
- **`ConfigFile`** — plugin settings, as in
  [saving player data](/concepts/persistent-data/).
