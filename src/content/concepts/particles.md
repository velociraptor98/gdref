---
title: Particles
category: rendering
summary: Sparks, smoke, explosions — emitters, and where the per-particle behaviour is configured.
mappingKind: approximate
bindings:
  - engine: unity
    symbol: UnityEngine.ParticleSystem
    signature: 'void Play(bool withChildren = true)'
    docsUrl: https://docs.unity3d.com/ScriptReference/ParticleSystem.html
    snippet: |
      [SerializeField] private ParticleSystem _sparks;

      void OnHit()
      {
          _sparks.Play();
      }

      void Configure()
      {
          var main = _sparks.main;
          main.startSpeed = 8f;   // modules are structs — reassign to apply
      }
    notes: >-
      One component with many modules (Emission, Shape, Velocity over Lifetime).
      Modules are returned by value, so you must assign back for changes to take.
  - engine: godot
    symbol: GPUParticles2D
    signature: 'var emitting: bool'
    docsUrl: https://docs.godotengine.org/en/4.4/classes/class_gpuparticles2d.html
    snippet: |
      func on_hit() -> void:
          $Sparks.restart()      # or: $Sparks.emitting = true

      func configure() -> void:
          # Per-particle behaviour lives on a separate Resource.
          var pm: ParticleProcessMaterial = $Sparks.process_material
          pm.initial_velocity_min = 8.0
          pm.initial_velocity_max = 12.0
    notes: >-
      The node holds emission settings (`amount`, `lifetime`, `one_shot`);
      per-particle behaviour lives on a `ParticleProcessMaterial` resource you
      assign to it.
migration:
  fromUnity: >-
    The split is the thing to internalise: Unity puts everything on one
    component, Godot separates the **emitter node** from the
    **process material** resource. `main.startSpeed` becomes
    `initial_velocity_min/max` on the material; `emission.rateOverTime` becomes
    `amount` and `lifetime` on the node. Because the behaviour is a resource, it
    is shareable across emitters exactly like a
    [data asset](/concepts/scriptable-objects/). Also pick your node type:
    `GPUParticles2D/3D` runs on the GPU and cannot be queried from script;
    `CPUParticles2D/3D` is slower but scriptable and works on weak hardware.
  fromGodot: >-
    Node plus material collapse into one component with modules. Remember that
    Unity's modules are value types — `var m = ps.main; m.startSpeed = 8;`
    silently does nothing without assigning `m` back.
related:
  - materials-and-shaders
  - render-order
---

Both engines give you a GPU-accelerated emitter configured largely in the
inspector. The organisation differs, and it follows Godot's general pattern of
pushing data into resources.

## Emitter node vs. behaviour resource

| Setting | Where in Godot |
| --- | --- |
| How many, how long, looping | the `GPUParticles2D/3D` node |
| Direction, speed, gravity, colour ramp, scale curve | `ParticleProcessMaterial` |
| What each particle looks like | `texture` on the node, or a mesh in 3D |

Because the process material is a `Resource`, one "smoke" behaviour can be
shared by every smoke emitter in the project, and edited in one place. Unity
achieves that with prefabs instead.

## GPU or CPU

A choice Unity does not make you make explicitly:

- **`GPUParticles2D/3D`** — simulated on the GPU. Fast, high counts. You cannot
  read particle positions from script, and collision is limited to signed
  distance fields or baked SDF volumes.
- **`CPUParticles2D/3D`** — simulated on the CPU. Scriptable, works on hardware
  or web exports where compute is unavailable.

Start with GPU. Switch if you need to inspect particles, or if you are targeting
platforms with weak compute support. There is a "Convert to CPUParticles" option
in the editor, so the decision is not permanent.

## One-shots

`one_shot = true` plus `restart()` is the `ParticleSystem.Play()` equivalent for
an explosion or impact effect. For a fire-and-forget emitter:

```gdscript
var fx := preload("res://fx/explosion.tscn").instantiate()
fx.global_position = position
get_tree().current_scene.add_child(fx)
fx.emitting = true
fx.finished.connect(fx.queue_free)
```

`finished` fires when a one-shot completes — the tidy way to clean up, and the
counterpart to Unity's Stop Action set to Destroy.

## Sub-emitters and trails

Unity's sub-emitter module has no single equivalent; nesting emitter nodes and
driving them from script covers most cases. Trails are a separate node
(`Line2D`, or `TrailMesh` approaches in 3D) rather than a module on the emitter.

This is an area where Godot is genuinely less featureful than Shuriken, and
noticeably less than VFX Graph. Complex Unity particle work is one of the harder
things to port.
