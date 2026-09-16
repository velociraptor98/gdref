---
title: Button held, pressed, released
category: input
summary: Test whether an action is currently down, or changed state this frame.
mappingKind: direct
bindings:
  - engine: unity
    symbol: UnityEngine.InputSystem.InputAction.IsPressed
    signature: bool IsPressed()
    docsUrl: https://docs.unity3d.com/Packages/com.unity.inputsystem@latest/index.html?subfolder=/api/UnityEngine.InputSystem.InputAction.html
    snippet: |
      if (_jump.action.WasPressedThisFrame()) Jump();
      if (_fire.action.IsPressed())           FireContinuous();
      if (_fire.action.WasReleasedThisFrame()) StopFiring();
    notes: >-
      Or drive it from callbacks instead — `action.performed += OnJump` — which
      avoids polling entirely.
  - engine: godot
    symbol: Input.is_action_pressed
    signature: 'func is_action_pressed(action: StringName, exact_match: bool = false) -> bool'
    docsUrl: https://docs.godotengine.org/en/4.4/classes/class_input.html#class-input-method-is-action-pressed
    snippet: |
      if Input.is_action_just_pressed("jump"):  jump()
      if Input.is_action_pressed("fire"):       fire_continuous()
      if Input.is_action_just_released("fire"): stop_firing()
    notes: >-
      The `just_` variants are frame-scoped, so they belong in `_process`.
      Calling them from `_physics_process` can miss or double-report, since the
      physics step does not run once per frame.
migration:
  fromUnity: >-
    `WasPressedThisFrame` becomes `is_action_just_pressed`, `IsPressed` becomes
    `is_action_pressed`. If you were using the callback style, the Godot
    equivalent is overriding `_unhandled_input` and testing the event.
  fromGodot: >-
    Direct swap, with the option of moving to `action.performed` callbacks and
    dropping the per-frame poll.
related:
  - input-actions
  - input-read-vector
---

Three states, same three methods, same semantics.

The one hazard is shared: "this frame" state is only coherent when read once
per frame. Reading `is_action_just_pressed` from `_physics_process`, or
`WasPressedThisFrame` from `FixedUpdate`, misbehaves in both engines for the
same reason — the fixed step does not run exactly once per frame.
