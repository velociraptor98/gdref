---
title: Input actions and bindings
category: input
summary: Define named actions in a project asset, bind them to physical inputs, read them by name.
mappingKind: approximate
bindings:
  - engine: unity
    symbol: UnityEngine.InputSystem.InputActionAsset
    signature: 'class InputActionAsset : ScriptableObject'
    docsUrl: https://docs.unity3d.com/Packages/com.unity.inputsystem@latest/index.html?subfolder=/manual/ActionAssets.html
    snippet: |
      // Actions live in an .inputactions asset, grouped into maps.
      // Generate a C# wrapper class from it, or reference actions directly.
      [SerializeField] private InputActionReference _move;

      void OnEnable()  => _move.action.Enable();
      void OnDisable() => _move.action.Disable();
    notes: >-
      Actions are grouped into **action maps** that you enable and disable as a
      unit — gameplay, menu, vehicle. Enabling is explicit and easy to forget;
      a silent action is almost always a missing `Enable()`.
  - engine: godot
    symbol: InputMap
    signature: class InputMap
    docsUrl: https://docs.godotengine.org/en/4.4/classes/class_inputmap.html
    snippet: |
      # Actions are defined in Project Settings > Input Map,
      # stored in project.godot, and are always active.
      if Input.is_action_pressed("move_right"):
          position.x += speed * delta
    notes: >-
      One flat, global namespace of actions, always enabled. There is no
      built-in grouping, so context switching is something you implement —
      commonly a state check, or `set_process_input(false)` on whole subtrees.
migration:
  fromUnity: >-
    The asset concept carries over almost unchanged: named actions, bound to
    physical inputs, defined once at project level. What you lose is action
    maps. Godot's actions are one global namespace with no enable/disable, so
    the gameplay-vs-menu switch that a map gave you for free becomes explicit —
    usually a namespacing convention plus a guard.
  fromGodot: >-
    Your actions become an `.inputactions` asset, and you must group them into
    at least one map and call `Enable()`. Nothing fires until you do.
related:
  - input-read-vector
  - input-button-state
---

This is the mapping that improved most when the old Input Manager fell out of
scope. `Input.GetAxis("Horizontal")` against a hidden project setting never
lined up cleanly with anything in Godot.

The modern pairing is genuinely close. Both engines define named actions in a
project-level asset, bind each to one or more physical inputs, and read them by
name at runtime. Rebinding, multiple bindings per action, and gamepad and
keyboard on the same action all work the same way in both.

The divergence is lifetime. Unity's actions are scoped to maps you turn on and
off; Godot's are global and always live. Porting in that direction, the map
boundary is the thing you have to rebuild by hand.
