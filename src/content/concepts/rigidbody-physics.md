---
title: Rigid body physics
category: physics
summary: Let the physics engine drive an object — forces, impulses, mass, drag.
mappingKind: approximate
bindings:
  - engine: unity
    symbol: UnityEngine.Rigidbody
    signature: 'void AddForce(Vector3 force, ForceMode mode)'
    docsUrl: https://docs.unity3d.com/ScriptReference/Rigidbody.html
    snippet: |
      [SerializeField] private Rigidbody _rb;

      void FixedUpdate()
      {
          _rb.AddForce(Vector3.forward * thrust, ForceMode.Force);
      }

      void Launch()
      {
          _rb.AddForce(Vector3.up * 10f, ForceMode.Impulse);
          _rb.linearVelocity = Vector3.zero;   // renamed in Unity 6
      }
    notes: >-
      `ForceMode` selects continuous force vs. instantaneous impulse. Unity 6
      renamed `velocity` to `linearVelocity` and `angularVelocity` is unchanged.
  - engine: godot
    symbol: RigidBody2D.apply_force
    signature: 'func apply_force(force: Vector2, position: Vector2 = Vector2(0, 0)) -> void'
    docsUrl: https://docs.godotengine.org/en/4.4/classes/class_rigidbody2d.html#class-rigidbody2d-method-apply-force
    snippet: |
      func _physics_process(_delta: float) -> void:
          apply_central_force(Vector2.RIGHT * thrust)

      func launch() -> void:
          apply_central_impulse(Vector2.UP * 400.0)
          linear_velocity = Vector2.ZERO

      # Full control: run your own integration.
      func _integrate_forces(state: PhysicsDirectBodyState2D) -> void:
          state.linear_velocity = state.linear_velocity.limit_length(max_speed)
    notes: >-
      Separate methods instead of a mode enum: `apply_force` vs
      `apply_impulse`, each with a `_central` variant that skips the torque
      from an offset application point.
migration:
  fromUnity: >-
    `ForceMode` becomes the method name. `AddForce(v, ForceMode.Force)` is
    `apply_central_force(v)`; `ForceMode.Impulse` is `apply_central_impulse(v)`.
    Drop the `_central` prefix when you want the force applied at an offset and
    the resulting spin. `linearVelocity` becomes `linear_velocity`, and `drag`
    becomes `linear_damp`. Note that most Unity *character* code should not come
    here at all — see [moving a character](/concepts/character-movement/).
  fromGodot: >-
    Method names collapse into `AddForce` plus a `ForceMode`. `_integrate_forces`
    has no clean equivalent; the nearest is writing to `linearVelocity` in
    `FixedUpdate`, which is less well-defined.
related:
  - character-movement
  - physics-step
  - collision-callbacks
---

Both engines wrap a solver in a component or node that integrates forces for
you. The mapping is mechanical once you know the naming.

## Force modes become method names

| Unity | Godot |
| --- | --- |
| `AddForce(v, ForceMode.Force)` | `apply_central_force(v)` |
| `AddForce(v, ForceMode.Impulse)` | `apply_central_impulse(v)` |
| `AddForceAtPosition(v, p)` | `apply_force(v, p - global_position)` |
| `AddTorque(t)` | `apply_torque(t)` |
| `AddForce(v, ForceMode.VelocityChange)` | set `linear_velocity` directly |

The `_central` variants apply through the centre of mass and generate no
rotation. The non-central ones take an **offset from the centre of mass**, not a
world position — a common off-by-a-position bug when porting
`AddForceAtPosition`.

## Property naming

| Unity | Godot |
| --- | --- |
| `linearVelocity` (was `velocity`) | `linear_velocity` |
| `angularVelocity` | `angular_velocity` |
| `mass` | `mass` |
| `drag` | `linear_damp` |
| `angularDrag` | `angular_damp` |
| `useGravity` | `gravity_scale` (0 disables) |
| `isKinematic` | `freeze` + `freeze_mode` |
| `constraints` | `axis_lock_*` (3D), `lock_rotation` (2D) |

## _integrate_forces has no Unity equivalent

Overriding `_integrate_forces` hands you the body's `PhysicsDirectBodyState`
mid-solve — the authoritative place to clamp velocity, apply custom gravity, or
teleport a body without fighting the solver:

```gdscript
func _integrate_forces(state: PhysicsDirectBodyState2D) -> void:
    state.linear_velocity = state.linear_velocity.limit_length(max_speed)
```

Setting `global_position` on a rigid body directly is unreliable in both
engines; in Godot, `state.transform` inside `_integrate_forces` is the correct
way to move one.

## Which body type

The same decision exists in both engines and is worth restating, because
choosing wrong is the usual cause of "my character feels awful":

| Need | Godot |
| --- | --- |
| Player/NPC with precise control | `CharacterBody2D/3D` |
| Physics-driven props, debris, ragdolls | `RigidBody2D/3D` |
| Moving platforms, doors | `AnimatableBody2D/3D` |
| Static geometry | `StaticBody2D/3D` |
| Overlap detection only | `Area2D/3D` |

Most Unity character controllers, whether built on `CharacterController` or on a
constrained Rigidbody, map onto `CharacterBody` rather than `RigidBody`.
