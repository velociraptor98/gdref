---
title: Parenting and transforms
category: scene-structure
summary: Move an object under a new parent, and reason about local vs. world space.
mappingKind: approximate
bindings:
  - engine: unity
    symbol: UnityEngine.Transform.SetParent
    signature: 'void SetParent(Transform parent, bool worldPositionStays = true)'
    docsUrl: https://docs.unity3d.com/ScriptReference/Transform.SetParent.html
    snippet: |
      // Keeps world position by default — the local transform is recomputed.
      item.transform.SetParent(hand, worldPositionStays: true);

      item.transform.localPosition = Vector3.zero;  // relative to parent
      var world = item.transform.position;          // absolute
    notes: >-
      Every GameObject has exactly one Transform, and it is not removable. Local
      and world are separate property pairs — `localPosition` vs `position`.
  - engine: godot
    symbol: Node.reparent
    signature: 'func reparent(new_parent: Node, keep_global_transform: bool = true) -> void'
    docsUrl: https://docs.godotengine.org/en/4.4/classes/class_node.html#class-node-method-reparent
    snippet: |
      # Keeps global transform by default, same as Unity.
      item.reparent(hand)

      item.position = Vector2.ZERO          # relative to parent
      var world := item.global_position     # absolute
    notes: >-
      Only `Node2D`, `Node3D` and `Control` have a transform at all — a plain
      `Node` has no position. The unprefixed name is the **local** one, which is
      the reverse of Unity's convention.
migration:
  fromUnity: >-
    `SetParent` becomes `reparent`, with the same keep-world-position default.
    The naming inverts and it catches people: Unity's `position` is world and
    `localPosition` is local; Godot's `position` is *local* and
    `global_position` is world. A mechanical port that maps `position` to
    `position` silently changes meaning.
  fromGodot: >-
    `reparent` becomes `SetParent`. Remember that everything has a Transform in
    Unity, so there is no equivalent of using a plain `Node` as a
    transform-free organisational parent — an empty GameObject still has one.
related:
  - coordinate-systems
  - find-nodes
  - components-vs-nodes
---

The operation is the same and even the default is the same: both keep the
object where it visually is and recompute its local transform.

## The naming inversion

| Meaning | Unity | Godot |
| --- | --- | --- |
| Relative to parent | `localPosition` | `position` |
| Absolute | `position` | `global_position` |

Godot treats local as the default and marks world explicitly; Unity does the
opposite. A find-and-replace port compiles cleanly and produces objects in the
wrong place, which is the worst failure mode available.

The same inversion applies across `rotation` / `global_rotation`, `scale` /
`global_scale` and `transform` / `global_transform`.

## Not every node has a transform

In Unity, a Transform is mandatory — an empty GameObject used purely for
grouping still has one, and still costs a matrix update.

In Godot, a bare `Node` has no spatial existence at all. This makes it a natural
container for pure logic (a state machine, a spawner, an inventory) with no
transform overhead and no chance of accidentally moving it. Reaching for a plain
`Node` instead of a `Node2D` when something has no position is idiomatic.
