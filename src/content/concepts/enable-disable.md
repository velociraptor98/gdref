---
title: Enabling and disabling an object
category: scene-structure
summary: Turn an object off — stop it updating, rendering and colliding — without destroying it.
mappingKind: approximate
bindings:
  - engine: unity
    symbol: UnityEngine.GameObject.SetActive
    signature: 'void SetActive(bool value)'
    docsUrl: https://docs.unity3d.com/ScriptReference/GameObject.SetActive.html
    snippet: |
      // One switch. Stops Update, rendering, physics and input
      // for this object and everything under it.
      _pauseMenu.SetActive(false);

      // Or disable a single behaviour, leaving rendering alone.
      _controller.enabled = false;
    notes: >-
      `SetActive(false)` cascades to the whole subtree, and `OnEnable`/
      `OnDisable` fire as it flips. Note that `activeSelf` and
      `activeInHierarchy` differ when a parent is the one that is off.
  - engine: godot
    symbol: Node.process_mode
    signature: 'var process_mode: Node.ProcessMode'
    docsUrl: https://docs.godotengine.org/en/4.4/classes/class_node.html#class-node-property-process-mode
    snippet: |
      # There is no single switch. Pick the axes you actually need:
      pause_menu.visible = false                             # rendering + input
      pause_menu.process_mode = Node.PROCESS_MODE_DISABLED   # _process, _physics_process
      $CollisionShape2D.set_deferred("disabled", true)       # physics

      # Or remove it from the tree entirely — the closest single equivalent.
      remove_child(pause_menu)   # you now own it; free it or re-add it later
    notes: >-
      Three independent axes: visibility, processing and collision. Hiding a
      node does not stop it processing, and disabling processing does not hide
      it.
migration:
  fromUnity: >-
    This is the mapping that most often ports subtly wrong. `SetActive(false)`
    has no single counterpart — decide which axis you actually meant. For UI,
    `visible = false` is usually enough, since hidden Controls stop receiving
    input. For gameplay objects you generally want `visible` *and*
    `process_mode` together, plus deferred disabling of collision shapes.
  fromGodot: >-
    Collapses to `SetActive(false)`, which covers all three axes at once. If you
    were toggling only processing, the closer match is `component.enabled` on
    the specific MonoBehaviour.
related:
  - components-vs-nodes
  - destroy-object
  - per-frame-update
---

Unity has one switch. Godot has three, and they are genuinely independent.

This is a common source of ported bugs that never raise an error — a "disabled"
object that is invisible but still running its `_process`, or still colliding
with the player.

## The axes

| What you want stopped | Godot |
| --- | --- |
| Rendering, and UI input | `visible = false` |
| `_process` / `_physics_process` / `_input` | `process_mode = PROCESS_MODE_DISABLED` |
| Physics collision | disable the `CollisionShape`, deferred |
| Everything | `remove_child()`, or all three above |

`visible` cascades to children, as does `process_mode` — a child set to
`PROCESS_MODE_INHERIT` follows its parent. So the two-line combination usually
does cover a whole subtree.

## Why collision needs `set_deferred`

Changing a collision shape's `disabled` flag during a physics callback mutates
the physics state while the engine is iterating it, and Godot will warn. The
idiom is:

```gdscript
$CollisionShape2D.set_deferred("disabled", true)
```

which applies the change at the end of the frame instead. This has no Unity
analogue, because Unity's `SetActive` already defers the whole operation.

## process_mode also governs pause

`process_mode` does double duty: it is how a node opts in or out of running
while `get_tree().paused` is true. `PROCESS_MODE_WHEN_PAUSED` on a pause menu
and `PROCESS_MODE_PAUSABLE` on gameplay is the standard pattern, and it replaces
the `Time.timeScale = 0` approach that is common in Unity.
