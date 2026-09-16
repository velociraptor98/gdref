---
title: Components vs. nodes
category: scene-structure
summary: Unity composes behaviour onto empty shells. Godot's nodes are the behaviour. GetComponent has no equivalent.
mappingKind: mental-model
bindings: []
migration:
  fromUnity: >-
    Stop looking for `GetComponent`. When you want a capability, you are not
    attaching it to the current object — you are adding a child node that *is*
    that capability, or choosing a different base class to extend. The reflex to
    replace is "what do I bolt on", which becomes "what should this be, and what
    should hang beneath it".
  fromGodot: >-
    A GameObject is an empty container; it does nothing until components are
    attached. There is no inheritance ladder to pick from, so capability comes
    from what you attach, not what you extend. Child GameObjects are for spatial
    grouping, not for capability.
related:
  - spawn-object
  - prefabs-vs-packed-scenes
  - initialization
---

This is the difference that makes ported code feel wrong even when it compiles,
and it does not reduce to a table row.

**Unity is composition.** A GameObject is an empty shell with a transform.
Everything it can do is a Component bolted onto it. A thing that moves, renders
and collides is one GameObject holding three components, found at runtime with
`GetComponent<T>()`.

**Godot is inheritance plus tree structure.** A Node *is* a capability.
`Sprite2D` is a thing that draws. `CharacterBody2D` is a thing that moves with
collision response. You do not attach a sprite to a node; the sprite node is
already the thing, and you get combinations by nesting nodes as children.

So the same object decomposes differently:

```
Unity                          Godot
Player (GameObject)            Player (CharacterBody2D)
  ├ Rigidbody2D                  ├ Sprite2D
  ├ SpriteRenderer               ├ CollisionShape2D
  ├ BoxCollider2D                └ AnimationPlayer
  └ PlayerController.cs          (script attached to Player itself)
```

Note where the script lives. In Unity it is one component among several, a peer
of the collider and renderer. In Godot it is attached *to* the node, extending
it — the script's `self` is the CharacterBody2D.

## What replaces GetComponent

There is no honest one-liner, because the question changes shape. The common
answers:

- **`$Child` / `get_node("Child")`** — when the capability is a child node. This
  is the most frequent translation, and `@onready var sprite := $Sprite2D` is
  the idiomatic form.
- **Just call the method** — when the capability is on the node your script
  extends. `move_and_slide()` needs no lookup; it is already yours.
- **A different base class** — when you were using a component to change what
  the object fundamentally is.

## Where Godot does compose

The picture is not purely inheritance. Nodes with no visual or spatial role are
routinely used as pure behaviour attached to a parent — a `StateMachine` node,
a `Health` node — which is composition in all but name, and the closest thing to
the component pattern Godot has.

Godot 4 also has resources, which are shareable data objects with no place in
the tree. `@export var stats: CharacterStats` is much closer to a ScriptableObject
than to a component, and it is the right tool when you want data shared across
instances rather than behaviour attached to one.
