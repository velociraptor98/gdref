---
title: Per-frame update
category: lifecycle
summary: Run code once per rendered frame, scaled by elapsed time.
mappingKind: direct
bindings:
  - engine: unity
    symbol: UnityEngine.MonoBehaviour.Update
    signature: void Update()
    docsUrl: https://docs.unity3d.com/ScriptReference/MonoBehaviour.Update.html
    snippet: |
      void Update()
      {
          transform.Translate(Vector3.forward * speed * Time.deltaTime);
      }
    notes: Delta time is read from the global `Time.deltaTime`, not passed in.
  - engine: godot
    symbol: Node._process
    signature: 'func _process(delta: float) -> void'
    docsUrl: https://docs.godotengine.org/en/4.4/classes/class_node.html#class-node-private-method-process
    snippet: |
      func _process(delta: float) -> void:
          position += transform.x * speed * delta
    notes: >-
      Delta arrives as a parameter. Godot skips the call entirely unless
      processing is enabled — `set_process(false)` is the cheap way to idle a
      node, with no equivalent cost to disabling a whole component.
migration:
  fromUnity: >-
    Use the `delta` parameter rather than reaching for a global. `Time` in Godot
    is a calendar and clock singleton, not a frame timer, so `Time.deltaTime`
    has no direct counterpart.
  fromGodot: >-
    Drop the parameter and read `Time.deltaTime`. If you need the unscaled
    value, that is `Time.unscaledDeltaTime`.
related:
  - physics-step
  - next-frame
---

The closest thing to a one-for-one mapping in the whole reference. Same
frequency, same purpose, same time-scaling semantics.

The only real difference is ergonomic: Godot passes delta as an argument, Unity
exposes it as a global. And Godot lets you switch a single node's processing on
and off with `set_process`, which is finer-grained than toggling a MonoBehaviour.
