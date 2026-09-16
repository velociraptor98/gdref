---
title: Moving a character
category: physics
summary: Drive a player or NPC with collision response — walk, slide along walls, stand on the floor.
mappingKind: approximate
bindings:
  - engine: unity
    symbol: UnityEngine.CharacterController.Move
    signature: 'CollisionFlags Move(Vector3 motion)'
    docsUrl: https://docs.unity3d.com/ScriptReference/CharacterController.Move.html
    snippet: |
      [SerializeField] private CharacterController _cc;
      private Vector3 _velocity;

      void Update()
      {
          if (_cc.isGrounded && _velocity.y < 0) _velocity.y = -2f;
          _velocity.y += gravity * Time.deltaTime;

          var move = new Vector3(_input.x, 0, _input.y) * speed;
          _cc.Move((move + _velocity) * Time.deltaTime);
      }
    notes: >-
      `CharacterController` is a capsule with built-in slide response. The
      alternative is a Rigidbody — note that Unity 6 renamed `velocity` to
      `linearVelocity`.
  - engine: godot
    symbol: CharacterBody2D.move_and_slide
    signature: 'func move_and_slide() -> bool'
    docsUrl: https://docs.godotengine.org/en/4.4/classes/class_characterbody2d.html#class-characterbody2d-method-move-and-slide
    snippet: |
      extends CharacterBody2D

      func _physics_process(delta: float) -> void:
          if not is_on_floor():
              velocity.y += gravity * delta     # +Y is DOWN in 2D

          var dir := Input.get_axis("left", "right")
          velocity.x = dir * speed

          move_and_slide()   # reads and writes `velocity`
    notes: >-
      `move_and_slide()` takes no arguments in Godot 4 — it reads the `velocity`
      property and writes the resolved value back. It is already delta-scaled,
      so do not multiply velocity by delta before calling it.
migration:
  fromUnity: >-
    `CharacterController` becomes `CharacterBody2D` / `CharacterBody3D`, and
    `isGrounded` becomes `is_on_floor()`. Two things change shape: velocity is a
    property on the body rather than a field you keep, and `move_and_slide()`
    applies delta internally — passing a pre-multiplied vector makes movement
    delta-squared and frame-rate dependent. If you were using a Rigidbody,
    `RigidBody2D/3D` is the match, but most Unity character code maps onto
    CharacterBody rather than RigidBody.
  fromGodot: >-
    `CharacterBody` becomes `CharacterController`, and you multiply by
    `Time.deltaTime` yourself at the call. `is_on_floor()` becomes `isGrounded`,
    which is less reliable on slopes — many projects replace it with a
    deliberate ground raycast.
related:
  - physics-step
  - collision-callbacks
  - coordinate-systems
---

Both engines ship a kinematic character body that moves, slides along walls and
reports what it is standing on. The APIs land in a similar place by different
routes.

## Velocity lives in different places

Unity's `CharacterController.Move(motion)` takes a displacement for this frame.
You own the velocity vector and do the delta multiplication.

Godot's `CharacterBody` owns a `velocity` property. You set it, call
`move_and_slide()`, and the body resolves collisions and writes the corrected
velocity back — so after a wall hit, `velocity` reflects the slide.

That write-back is useful and easy to miss. Reading `velocity` after
`move_and_slide()` tells you what actually happened, not what you asked for.

## The delta trap

The most common porting bug in this whole reference:

```gdscript
velocity = direction * speed * delta   # WRONG
move_and_slide()
```

`move_and_slide()` already applies delta. Multiplying first makes movement
scale with the square of frame time — fast machines move slower, and it looks
like a physics bug rather than an arithmetic one.

Gravity *is* multiplied by delta, because you are accumulating an acceleration
into a velocity. Velocity itself is not.

## Grounded checks

`is_on_floor()` is computed from the last `move_and_slide()` and is generally
more dependable than Unity's `isGrounded`, which is notoriously flaky on slopes
and steps. It is governed by `floor_max_angle` and `up_direction` on the body,
so slope tolerance is configuration rather than custom raycasting.

Call it *after* `move_and_slide()` for this frame's answer, or before it for
last frame's — the ordering matters for coyote-time logic.

## 3D forward

In 3D, remember the handedness flip from
[coordinate systems](/concepts/coordinate-systems/): Unity's
`transform.forward` is `+Z`, Godot's forward is `-basis.z`. A character that
walks backwards is almost always this.
