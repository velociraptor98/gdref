---
title: Wait one frame
category: async
summary: Yield until the next frame before continuing.
mappingKind: direct
bindings:
  - engine: unity
    symbol: UnityEngine.Awaitable.NextFrameAsync
    signature: static Awaitable NextFrameAsync(CancellationToken ct = default)
    docsUrl: https://docs.unity3d.com/ScriptReference/Awaitable.NextFrameAsync.html
    snippet: |
      async Awaitable Spawn()
      {
          var go = Instantiate(_prefab);
          await Awaitable.NextFrameAsync();  // let Start() run
          go.GetComponent<Enemy>().Activate();
      }
  - engine: godot
    symbol: SceneTree.process_frame
    signature: signal process_frame()
    docsUrl: https://docs.godotengine.org/en/4.4/classes/class_scenetree.html#class-scenetree-signal-process-frame
    snippet: |
      func spawn() -> void:
          var enemy := enemy_scene.instantiate()
          add_child(enemy)
          await get_tree().process_frame
          enemy.activate()
migration:
  fromUnity: '`await get_tree().process_frame` — awaiting the tree signal directly.'
  fromGodot: '`await Awaitable.NextFrameAsync()`.'
related:
  - wait-for-seconds
  - per-frame-update
---

Used for the same reason in both engines: something needs a frame boundary to
pass before it is safe to touch — usually a newly created object whose
initialization callback has not run yet.

Worth noting that Godot's two-step spawn often removes the need for this trick
entirely, since you can configure the node before `add_child` makes it live.
