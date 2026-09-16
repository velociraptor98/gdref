---
title: Prefabs vs. packed scenes
category: assets
summary: Both are reusable object templates. They diverge on nesting, inheritance and overrides, which is where a day gets lost.
mappingKind: mental-model
bindings: []
migration:
  fromUnity: >-
    A PackedScene is your prefab, and the biggest change is that the distinction
    between "a scene" and "a prefab" disappears. Every scene is instantiable
    into another scene. There is no prefab mode to enter — you open the scene
    and edit it, and that is the same thing.
  fromGodot: >-
    A prefab is your PackedScene, but a Unity scene is *not* a prefab and cannot
    be instantiated into another scene. That split is the main adjustment:
    reusable things must be prefab assets, and scenes are only ever the root.
related:
  - spawn-object
  - components-vs-nodes
---

These rhyme closely enough that porting feels smooth right up to the point where
it does not.

The shared idea: a saved template of an object tree, instantiable many times,
where edits to the template propagate to instances, and per-instance overrides
survive those edits.

## Where they diverge

**There is no scene/prefab split in Godot.** Unity separates scenes (levels you
load) from prefabs (templates you instantiate). Godot has one concept. Every
`.tscn` is both — you can load it as the main scene or instantiate it as a
child. A Godot project is typically many small scenes composed into larger ones,
which has no real Unity analogue.

**Inherited scenes are the closest thing to prefab variants.** Both give you a
template deriving from another template with its own overrides. Godot's version
is stricter: you may add nodes and change properties, but you cannot remove an
inherited node. Unity's variants allow deactivating objects, which is often used
to fake removal.

**Editable children is opt-in, and easily missed.** Instantiate a scene in Godot
and its internals are locked — you see the root, not the subtree. Right-click,
"Editable Children", and the subtree opens for per-instance modification. Unity
exposes the whole hierarchy by default and tracks overrides per property.

This catches Unity developers early: reaching into an instance's children to
tweak something and finding nothing selectable is not a bug.

**Override granularity differs.** Unity tracks overrides per property with UI to
see and revert them, and nested prefabs have well-defined precedence. Godot
stores changed properties in the instancing scene's file with less tooling
around inspection. Godot's model is simpler to reason about; Unity's is more
discoverable when it goes wrong.

## The practical advice

Porting a Unity project, resist recreating the prefab/scene split. It fights the
engine. The Godot-idiomatic structure is many small scenes that each own one
responsibility, composed upward — closer to how you would use nested prefabs
than how you would use Unity scenes.
