---
title: Logging and debug drawing
category: debugging
summary: Printing to the console, drawing debug shapes, and asserting.
mappingKind: approximate
bindings:
  - engine: unity
    symbol: UnityEngine.Debug
    signature: 'static void Log(object message)'
    docsUrl: https://docs.unity3d.com/ScriptReference/Debug.html
    snippet: |
      Debug.Log($"health = {_health}");
      Debug.LogWarning("no spawn point");
      Debug.LogError("missing reference");
      Debug.Assert(_target != null, "target required");

      // Clicking a logged message selects the object.
      Debug.Log("hit", gameObject);

      void OnDrawGizmos()
      {
          Gizmos.color = Color.red;
          Gizmos.DrawWireSphere(transform.position, _radius);
      }
    notes: >-
      `Debug.DrawLine` draws in play mode; `OnDrawGizmos` draws in the editor.
      Passing a context object makes the log entry clickable.
  - engine: godot
    symbol: '@GlobalScope.print'
    signature: 'func print(...) -> void'
    docsUrl: https://docs.godotengine.org/en/4.4/classes/class_@globalscope.html#class-globalscope-method-print
    snippet: |
      print("health = ", health)
      print_rich("[color=yellow]warning[/color]")
      push_warning("no spawn point")     # shows in the Debugger panel
      push_error("missing reference")
      assert(target != null, "target required")

      # Debug drawing: a @tool script with _draw, or a Line2D/MeshInstance.
      func _draw() -> void:
          if OS.is_debug_build():
              draw_circle(Vector2.ZERO, radius, Color.RED)
    notes: >-
      `print` goes to Output; `push_warning`/`push_error` also register in the
      Debugger panel with a stack trace. `assert` is stripped from release
      builds, including its expression.
migration:
  fromUnity: >-
    `Debug.Log` becomes `print`, and `LogWarning`/`LogError` become
    `push_warning`/`push_error` — which matter because they appear in the
    Debugger panel with a stack trace rather than just scrolling past in Output.
    The notable gap is gizmos: there is no `OnDrawGizmos` equivalent, so editor
    visualisation means a [`@tool` script](/concepts/editor-tools/) with `_draw`,
    and runtime debug shapes mean real nodes (`Line2D`, `MeshInstance3D`) or
    `CanvasItem` draw calls.
  fromGodot: >-
    `print` becomes `Debug.Log`. `_draw`-based visualisation becomes
    `OnDrawGizmos`, which is considerably more convenient for editor-time
    debugging.
related:
  - editor-tools
  - gdscript-vs-csharp
---

Printing maps cleanly. Debug *drawing* is the real difference, and it is one of
the places Unity is genuinely ahead.

## The print family

| Function | Goes to |
| --- | --- |
| `print(...)` | Output panel and stdout |
| `print_rich(...)` | Output, with BBCode colour |
| `printerr(...)` | stderr |
| `push_warning(...)` | Debugger panel, with stack trace |
| `push_error(...)` | Debugger panel, with stack trace |
| `print_debug(...)` | Output, debug builds only, with source location |

Use `push_error` and `push_warning` for anything a developer should act on.
`print` scrolls away; the Debugger panel keeps a list with jump-to-source.

`print` takes multiple arguments and concatenates without separators, so
`print("hp = ", hp)` is idiomatic where C# would interpolate.

## assert is stripped entirely

```gdscript
assert(index >= 0, "index must be positive")
```

In release builds, the whole statement is removed — including the expression, so
side effects inside an assert disappear. Unity's `Debug.Assert` remains unless
you compile it out.

## No gizmos

The honest gap. Unity's `OnDrawGizmos` is a single method giving you editor
visualisation of radii, ranges and paths without affecting the game.

Godot's options:

- **`@tool` + `_draw()`** — runs in the editor, draws into the 2D viewport. The
  closest equivalent, covered in [editor tooling](/concepts/editor-tools/).
  Guard with `Engine.is_editor_hint()`.
- **Real nodes** — a `Line2D` or `MeshInstance3D` you free in release builds.
  Crude but effective for runtime visualisation.
- **Built-in overlays** — Debug menu > Visible Collision Shapes, Visible
  Navigation, and Visible Avoidance cover the common cases for free, and are
  often all you needed.
- **`CanvasItem.draw_*`** in `_draw()` at runtime, guarded by
  `OS.is_debug_build()`.

Check the built-in overlays before writing anything. Collision shapes and
navigation meshes are visible with a menu toggle in both editor and running game.

## The debugger

Godot's Debugger panel is richer than the Console: a remote scene tree you can
inspect and edit while the game runs, a profiler, a network monitor, and a
Misc tab showing what was clicked. The remote tree in particular replaces a lot
of debug logging — you can watch a value change on a live node rather than
printing it.
