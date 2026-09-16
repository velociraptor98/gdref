---
title: Read a 2D movement vector
category: input
summary: Turn a stick or WASD cluster into a normalized direction vector.
mappingKind: direct
bindings:
  - engine: unity
    symbol: UnityEngine.InputSystem.InputAction.ReadValue
    signature: 'T ReadValue<T>() where T : struct'
    docsUrl: https://docs.unity3d.com/Packages/com.unity.inputsystem@latest/index.html?subfolder=/api/UnityEngine.InputSystem.InputAction.html
    snippet: |
      void Update()
      {
          Vector2 move = _move.action.ReadValue<Vector2>();
          transform.Translate(new Vector3(move.x, 0, move.y) * speed * Time.deltaTime);
      }
    notes: >-
      The action must be set up as a Value action of type Vector2, typically
      with a 2D Vector composite binding for keyboard.
  - engine: godot
    symbol: Input.get_vector
    signature: 'func get_vector(negative_x: StringName, positive_x: StringName, negative_y: StringName, positive_y: StringName, deadzone: float = -1.0) -> Vector2'
    docsUrl: https://docs.godotengine.org/en/4.4/classes/class_input.html#class-input-method-get-vector
    snippet: |
      func _process(delta: float) -> void:
          var move := Input.get_vector("left", "right", "up", "down")
          position += move * speed * delta
    notes: >-
      Composes four separate actions at the call site rather than in the asset,
      and handles deadzone and normalization for you.
migration:
  fromUnity: >-
    The composite moves from the asset to the call. Where Unity binds a 2D
    Vector composite inside the action, Godot names four one-dimensional actions
    at the point of use. Mind the Y sign — screen-space Y grows downward.
  fromGodot: >-
    Define one Value action of type Vector2 and add a 2D Vector composite
    binding, then `ReadValue<Vector2>()`.
related:
  - input-actions
  - input-button-state
---

Same output, same deadzone handling, same normalization. The only structural
difference is where the composition happens: Unity composes four keys into one
action inside the asset, Godot composes four actions into one vector at the
call site.

Godot's approach means the four actions stay independently readable, which is
occasionally useful. Unity's means the binding UI shows you the composite as a
single unit.
