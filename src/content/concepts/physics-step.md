---
title: Physics step
category: lifecycle
summary: Run code on the fixed timestep, decoupled from frame rate.
mappingKind: direct
bindings:
  - engine: unity
    symbol: UnityEngine.MonoBehaviour.FixedUpdate
    signature: void FixedUpdate()
    docsUrl: https://docs.unity3d.com/ScriptReference/MonoBehaviour.FixedUpdate.html
    snippet: |
      void FixedUpdate()
      {
          _rb.AddForce(Vector3.up * thrust, ForceMode.Force);
      }
    notes: >-
      Uses `Time.fixedDeltaTime`. May run zero or several times in a frame
      depending on how far the accumulator has drifted.
  - engine: godot
    symbol: Node._physics_process
    signature: 'func _physics_process(delta: float) -> void'
    docsUrl: https://docs.godotengine.org/en/4.4/classes/class_node.html#class-node-private-method-physics-process
    snippet: |
      func _physics_process(delta: float) -> void:
          velocity.y += gravity * delta
          move_and_slide()
    notes: >-
      Rate is set by `Engine.physics_ticks_per_second` (60 by default). Same
      variable-call-count behaviour as Unity.
migration:
  fromUnity: >-
    Direct swap. Keep the same discipline about which code lives here — anything
    touching a physics body belongs on the fixed step in both engines.
  fromGodot: Direct swap.
related:
  - per-frame-update
  - raycast
---

Both engines run physics on a fixed accumulator and give you a hook on it. Both
may call that hook zero, one, or several times within a single rendered frame.

The rule is identical on both sides: anything that applies forces or moves a
physics body belongs on the fixed step. Anything reading input or driving
visuals belongs on the frame step.
