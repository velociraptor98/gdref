---
title: Finding other objects
category: scene-structure
summary: Get a reference to something else — a sibling capability, a child, or an object elsewhere in the scene.
mappingKind: approximate
bindings:
  - engine: unity
    symbol: UnityEngine.Component.GetComponent
    signature: 'T GetComponent<T>()'
    docsUrl: https://docs.unity3d.com/ScriptReference/Component.GetComponent.html
    snippet: |
      private Rigidbody _rb;

      void Awake()
      {
          _rb = GetComponent<Rigidbody>();              // same GameObject
          _muzzle = GetComponentInChildren<Muzzle>();   // down the hierarchy
      }

      void Start()
      {
          // Anywhere in the scene. Unity 6 API — FindObjectsOfType is deprecated.
          _manager = FindFirstObjectByType<GameManager>();
      }
    notes: >-
      Lookups are by **type**. Cache them in Awake; `GetComponent` walks the
      component list on every call and the scene-wide `Find*` methods are far
      more expensive again.
  - engine: godot
    symbol: Node.get_node
    signature: 'func get_node(path: NodePath) -> Node'
    docsUrl: https://docs.godotengine.org/en/4.4/classes/class_node.html#class-node-method-get-node
    snippet: |
      # Down the tree, resolved once the node is ready.
      @onready var sprite: Sprite2D = $Sprite2D
      @onready var muzzle: Marker2D = %Muzzle   # scene-unique name

      func alert_all() -> void:
          # Anywhere in the tree — by group, not by type.
          for enemy in get_tree().get_nodes_in_group("enemies"):
              enemy.alert()
    notes: >-
      Lookups are by **path** or **group**. `$Sprite2D` is shorthand for
      `get_node("Sprite2D")`, and `%Muzzle` resolves a scene-unique name from
      anywhere in that scene, surviving moves in the hierarchy.
migration:
  fromUnity: >-
    The question changes from "what type is it" to "where is it". Most
    `GetComponent` calls become `@onready var x := $Child`. Scene-wide `Find`
    calls become **groups** — `add_to_group("enemies")` plus
    `get_tree().get_nodes_in_group("enemies")` — which is closer to Unity tags
    than to type lookup. The `@onready` part is not optional: `$Child` evaluated
    at class scope runs before the node is in the tree and returns null.
  fromGodot: >-
    Paths become types. There is no `%UniqueName` equivalent, so a reference
    that must survive hierarchy changes becomes a serialized field you wire in
    the Inspector. Groups become tags, or a manually maintained registry.
related:
  - components-vs-nodes
  - initialization
  - destroy-object
---

Both engines need a way to say "give me that other thing", and they index by
different keys: Unity by type, Godot by position in the tree.

That follows directly from [components vs. nodes](/concepts/components-vs-nodes/).
If capability comes from what you attached, type is the natural lookup key. If
capability comes from what a node *is*, position is.

## The three cases

| Need | Unity | Godot |
| --- | --- | --- |
| A capability on this object | `GetComponent<T>()` | already `self` — just call it |
| Something below me | `GetComponentInChildren<T>()` | `$Child` / `@onready` |
| Something anywhere | `FindFirstObjectByType<T>()` | `get_tree().get_nodes_in_group(...)` |

The middle row is where most ported code lands.

## Two things that bite

**`@onready` is load-bearing.** `var sprite := $Sprite2D` at class scope runs
during object construction, before the node enters the tree, and fails.
`@onready` defers the assignment to just before `_ready`. This is the single
most common first-day error coming from Unity.

**Scene-unique names have no Unity counterpart.** Marking a node unique with
`%` in the editor lets you write `%Healthbar` from anywhere in that scene
regardless of how deeply it is nested, and it keeps working when you move the
node. The nearest Unity equivalent is a serialized field wired by hand.
