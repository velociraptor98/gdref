---
title: Collision and trigger callbacks
category: physics
summary: React when two objects touch — a pickup entering a zone, a bullet hitting a wall.
mappingKind: approximate
bindings:
  - engine: unity
    symbol: UnityEngine.MonoBehaviour.OnTriggerEnter
    signature: 'void OnTriggerEnter(Collider other)'
    docsUrl: https://docs.unity3d.com/ScriptReference/Collider.OnTriggerEnter.html
    snippet: |
      // Overlap — collider marked "Is Trigger".
      void OnTriggerEnter(Collider other)
      {
          if (other.CompareTag("Player")) Collect();
      }

      // Physical contact, with impact data.
      void OnCollisionEnter(Collision collision)
      {
          Debug.Log($"hit at {collision.contacts[0].point}");
      }
    notes: >-
      Magic method names found by reflection, so a typo fails silently. One of
      the two objects must have a Rigidbody or nothing fires at all.
  - engine: godot
    symbol: Area2D.body_entered
    signature: 'signal body_entered(body: Node2D)'
    docsUrl: https://docs.godotengine.org/en/4.4/classes/class_area2d.html#class-area2d-signal-body-entered
    snippet: |
      # Overlap — an Area2D/Area3D node emits signals.
      func _ready() -> void:
          $PickupArea.body_entered.connect(_on_body_entered)

      func _on_body_entered(body: Node2D) -> void:
          if body.is_in_group("player"):
              collect()

      # Physical contact for a moving character.
      func _physics_process(_delta: float) -> void:
          move_and_slide()
          for i in get_slide_collision_count():
              var c := get_slide_collision(i)
              print("hit %s at %s" % [c.get_collider(), c.get_position()])
    notes: >-
      Signals, so connections are explicit and checked. `RigidBody2D` also has
      `body_entered`, but it stays silent until you set `contact_monitor = true`
      and `max_contacts_reported` above zero.
migration:
  fromUnity: >-
    Triggers become `Area2D` / `Area3D` nodes with `body_entered` and
    `area_entered` signals. The big structural change is that the trigger stops
    being a flag on a collider and becomes its own node in the tree — so a
    pickup is a node *containing* an Area, not a collider with a checkbox.
    `CompareTag` becomes `is_in_group`. For solid collisions on a character, the
    callback disappears entirely: you query `get_slide_collision()` after
    `move_and_slide()` instead of being called back.
  fromGodot: >-
    Areas become colliders with Is Trigger checked, and signals become the magic
    `OnTriggerEnter` methods. Make sure one participant has a Rigidbody —
    without it nothing fires and there is no warning.
related:
  - character-movement
  - collision-layers
  - events-and-signals
  - physics-step
---

Both engines distinguish *overlap* (a zone noticing something passed through)
from *contact* (two solid things hitting). They differ in how you are told.

## Overlap: flag vs. node

Unity makes trigger-ness a property of a collider — tick Is Trigger, and the
object stops blocking and starts reporting.

Godot makes it a node type. `Area2D` and `Area3D` exist to detect overlap and
cannot block anything. A pickup is a node with an `Area2D` child, not a collider
with a checkbox flipped.

Godot separates the two signal families too: `body_entered` for physics bodies,
`area_entered` for other areas. Unity's `OnTriggerEnter` fires for both and
leaves you to sort it out.

## Contact: callback vs. query

This is the larger shift. Unity calls you back with `OnCollisionEnter` and hands
you contact points.

For a `CharacterBody2D/3D` in Godot there is no callback. `move_and_slide()`
resolves the movement and records what it hit; you ask afterwards:

```gdscript
move_and_slide()
for i in get_slide_collision_count():
    var collision := get_slide_collision(i)
    # collision.get_collider(), .get_normal(), .get_position()
```

Inverted control flow, same information. It fits Godot's model where the
character body is driven explicitly each physics step rather than handed to the
solver.

## The RigidBody footgun

`RigidBody2D` and `RigidBody3D` *do* have `body_entered`, so it looks like the
direct equivalent — but it does not fire by default. You need:

```gdscript
contact_monitor = true
max_contacts_reported = 4   # anything above 0
```

Both default to off for performance. This is the single most common "my
collision signal never fires" question in Godot, and it is silent rather than
warned.

## Magic names vs. signals

Unity's callbacks are found by reflection on exact names. Misspell
`OnTriggerEnter` and it simply never runs.

Godot's are signals — `connect` on a name that does not exist raises an error,
and connections made in the editor's Node dock are visible in the scene file.
The tradeoff is that connecting is a step you must remember; nothing happens
implicitly.
