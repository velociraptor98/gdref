---
title: Execution order
category: lifecycle
summary: Controlling which script runs first when order actually matters.
mappingKind: approximate
bindings:
  - engine: unity
    symbol: UnityEngine.DefaultExecutionOrder
    signature: '[DefaultExecutionOrder(-100)]'
    docsUrl: https://docs.unity3d.com/ScriptReference/DefaultExecutionOrder.html
    snippet: |
      // Lower runs earlier. Default is 0.
      [DefaultExecutionOrder(-100)]
      public class InputReader : MonoBehaviour { }

      // Or set it project-wide:
      // Project Settings > Script Execution Order
    notes: >-
      Applies per script class, across the whole project. Unordered scripts run
      in an unspecified order relative to each other.
  - engine: godot
    symbol: Node.process_priority
    signature: 'var process_priority: int'
    docsUrl: https://docs.godotengine.org/en/4.4/classes/class_node.html#class-node-property-process-priority
    snippet: |
      # Lower runs earlier. Default is 0. Per node, not per script.
      func _ready() -> void:
          process_priority = -100

      # _ready order is structural: children before parents, always.
    notes: >-
      `process_priority` orders `_process`; `physics_interpolation` aside,
      `process_physics_priority` does the same for `_physics_process`. Neither
      affects `_ready`.
migration:
  fromUnity: >-
    `[DefaultExecutionOrder]` becomes `process_priority`, with the same
    lower-runs-first convention — but it is set per node instance rather than
    per script class, so a prefab-wide guarantee becomes something you set in
    `_ready` or configure in the inspector. For initialisation order, there is
    usually nothing to port: Godot's `_ready` is deterministic bottom-up, and
    [autoloads](/concepts/singletons-autoload/) initialise in their declared
    order before any scene does.
  fromGodot: >-
    `process_priority` becomes `[DefaultExecutionOrder]` on the class. Godot's
    structural `_ready` guarantee does not exist in Unity, so ordering that
    relied on children-before-parents needs to become explicit — usually an
    Awake/Start split.
related:
  - initialization
  - singletons-autoload
  - per-frame-update
---

Unity gives you one ordering knob covering the whole lifecycle. Godot splits it:
initialisation order is structural and not configurable, while per-frame order
is a property.

## Initialisation: nothing to configure

Godot's `_ready` runs **bottom-up** — every descendant is ready before its
parent. That is a guarantee, not a default, and it removes most of the reasons
Unity projects reach for execution order in the first place.

The practical rule that falls out: reaching *down* the tree in `_ready` is
always safe. Reaching *up* or sideways is not, because the parent has not run
yet. When you need that, the idioms are:

```gdscript
await owner.ready          # wait for the scene root to finish
call_deferred("_late_setup")   # run after the current frame settles
```

[Autoloads](/concepts/singletons-autoload/) cover the global case: they
initialise in the order listed in Project Settings, entirely before the main
scene, so "this must exist before anything else" is a registration-order
question rather than a script-attribute question.

## Per-frame: process_priority

`process_priority` orders `_process` calls across nodes, lower first, default
zero. `process_physics_priority` does the same for `_physics_process`.

The difference from Unity is scope: it is a property on a *node instance*, not
an attribute on a *script class*. Setting it in `_ready` is the closest
equivalent to `[DefaultExecutionOrder]`, though it can also be set in the
inspector per instance — more flexible, less global.

## When you need this at all

In both engines, needing fine-grained execution order is usually a sign that
something should be an explicit call instead. If a camera must update after the
player moves, `process_priority` works — but so does the player emitting a
signal the camera listens to, and that version does not break when someone
adds a third participant.

Godot's node structure gives a third option Unity lacks: reorder the nodes. For
siblings at the same priority, `_process` follows tree order, so moving a node
above another in the scene dock changes execution order directly.
