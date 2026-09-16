---
title: Raycast against the world
category: physics
summary: Fire a ray into the physics world and find what it hits.
mappingKind: approximate
bindings:
  - engine: unity
    symbol: UnityEngine.Physics.Raycast
    signature: static bool Raycast(Vector3 origin, Vector3 direction, out RaycastHit hitInfo, float maxDistance)
    docsUrl: https://docs.unity3d.com/ScriptReference/Physics.Raycast.html
    snippet: |
      if (Physics.Raycast(transform.position, transform.forward,
                          out RaycastHit hit, 100f, _mask))
      {
          Debug.Log($"hit {hit.collider.name} at {hit.point}");
      }
    notes: >-
      A static call on the global `Physics` class. Returns a bool with the hit
      in an out parameter.
  - engine: godot
    symbol: PhysicsDirectSpaceState3D.intersect_ray
    signature: 'func intersect_ray(parameters: PhysicsRayQueryParameters3D) -> Dictionary'
    docsUrl: https://docs.godotengine.org/en/4.4/classes/class_physicsdirectspacestate3d.html#class-physicsdirectspacestate3d-method-intersect-ray
    snippet: |
      func _physics_process(_delta: float) -> void:
          var space := get_world_3d().direct_space_state
          var query := PhysicsRayQueryParameters3D.create(
              global_position, global_position + -global_transform.basis.z * 100.0)
          query.collision_mask = mask
          var hit := space.intersect_ray(query)
          if hit:
              print("hit %s at %s" % [hit.collider.name, hit.position])
    notes: >-
      Goes through the world's space state, configured by a query object.
      Returns an empty Dictionary on a miss, which is falsy — hence `if hit`.
      Must be called from `_physics_process`; the space state is locked
      elsewhere in the frame.
migration:
  fromUnity: >-
    More ceremony for the same result. Three differences that catch people: the
    query takes a destination point rather than a direction and distance; the
    result is an untyped Dictionary rather than a struct; and it must run during
    the physics step or the space state will be locked.
  fromGodot: >-
    Collapses to a single static call, and can be issued from anywhere.
    `hit.position` becomes `hit.point`.
related:
  - physics-step
---

Same query, very different ergonomics. Unity offers a static call on a global;
Godot routes through the world's space state with a configuration object.

Godot's extra structure buys you reusable query objects and explicit control
over exclusions, collision masks and whether to hit areas or bodies. Unity
covers the same ground with overloads and layer masks.

The locking rule is the one that produces confusing bugs rather than errors.
Outside `_physics_process`, the space state is not safe to query, and results
are unreliable rather than loudly wrong.
