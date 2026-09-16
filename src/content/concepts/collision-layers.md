---
title: Collision layers and masks
category: physics
summary: Control which objects can collide with, or be detected by, which others.
mappingKind: direct
bindings:
  - engine: unity
    symbol: UnityEngine.LayerMask
    signature: 'struct LayerMask'
    docsUrl: https://docs.unity3d.com/ScriptReference/LayerMask.html
    snippet: |
      [SerializeField] private LayerMask _enemyMask;

      void Check()
      {
          // Queries take a mask; object-vs-object collision comes from the
          // global Physics settings matrix, not from the object.
          if (Physics.Raycast(origin, dir, out var hit, 100f, _enemyMask))
              Damage(hit.collider);
      }
    notes: >-
      A GameObject is on exactly **one** layer. Which layers interact is a
      single project-wide matrix in Project Settings > Physics.
  - engine: godot
    symbol: CollisionObject2D.collision_layer
    signature: 'var collision_layer: int'
    docsUrl: https://docs.godotengine.org/en/4.4/classes/class_collisionobject2d.html#class-collisionobject2d-property-collision-layer
    snippet: |
      # Two properties per object:
      #   collision_layer — which layers I am ON  (what others can find)
      #   collision_mask  — which layers I SCAN   (what I react to)
      collision_layer = 0b0010   # layer 2: "enemy"
      collision_mask  = 0b0101   # scans layers 1 and 3

      # Or by name, if layers are named in Project Settings.
      set_collision_layer_value(2, true)
      set_collision_mask_value(1, true)
    notes: >-
      An object can be on **many** layers at once. Interaction is decided
      per-object by layer/mask rather than by a global matrix.
migration:
  fromUnity: >-
    The concept carries over; the bookkeeping moves. Instead of one layer per
    object plus a project-wide matrix, each object declares both what it *is*
    (`collision_layer`) and what it *cares about* (`collision_mask`). That means
    interaction can be asymmetric — an enemy can detect the player while the
    player ignores the enemy — which the Unity matrix cannot express.
  fromGodot: >-
    Collapse layer and mask into a single layer per object and express the
    pairings in the Physics matrix. Asymmetric relationships have to be
    reproduced with query-time masks, since the matrix is symmetric.
related:
  - collision-callbacks
  - raycast
---

The same idea in both engines: bitmask filtering so objects only interact with
what they should. Both support 32 layers, and both let you name them in project
settings.

## One matrix vs. two properties

Unity puts an object on one layer and decides interactions globally in the
Physics matrix. It is compact and easy to audit — one grid shows every
relationship in the project.

Godot gives each object two bitmasks:

- **`collision_layer`** — the layers this object occupies. What others can see.
- **`collision_mask`** — the layers this object scans. What it reacts to.

Two objects interact when one's mask intersects the other's layer.

## Asymmetry is the practical difference

Because Godot decides per object, relationships can go one way. An enemy's
detection area can scan the player layer while the player scans only the world
layer — the enemy notices the player, the player never notices the enemy.

Unity's matrix is symmetric by construction, so this needs a workaround: extra
layers, or masks supplied at query time.

The flip side is auditability. Godot has no single place showing every
relationship; you read it off individual objects, and a misconfigured mask is
harder to spot.

## Naming layers

Both engines let you name layers in project settings, and both are much easier
to work with once you do. In Godot, naming enables the readable accessor form:

```gdscript
set_collision_mask_value(3, true)   # layer 3, by its configured name in the editor
```

which beats maintaining raw bit arithmetic in code.
