---
title: Background work and threads
category: async
summary: Move expensive work off the main thread — pathfinding, chunk generation, file IO.
mappingKind: approximate
bindings:
  - engine: unity
    symbol: UnityEngine.Awaitable
    signature: 'static Awaitable BackgroundThreadAsync()'
    docsUrl: https://docs.unity3d.com/ScriptReference/Awaitable.BackgroundThreadAsync.html
    snippet: |
      async Awaitable Generate()
      {
          await Awaitable.BackgroundThreadAsync();
          var mesh = BuildMeshData();          // off the main thread
          await Awaitable.MainThreadAsync();
          _filter.mesh = mesh;                 // engine API needs main thread
      }
    notes: >-
      `Awaitable` can hop threads explicitly. The Job System plus Burst is the
      heavier option for data-parallel work. Unity APIs are main-thread only.
  - engine: godot
    symbol: WorkerThreadPool.add_task
    signature: 'func add_task(action: Callable, high_priority: bool = false, description: String = "") -> int'
    docsUrl: https://docs.godotengine.org/en/4.4/classes/class_workerthreadpool.html#class-workerthreadpool-method-add-task
    snippet: |
      func generate() -> void:
          var id := WorkerThreadPool.add_task(_build_chunk)
          # ... later, when you need the result:
          WorkerThreadPool.wait_for_task_completion(id)
          _apply_chunk()

      func _build_chunk() -> void:
          var data := _expensive_work()
          # Touch the scene tree only via call_deferred.
          _apply.call_deferred(data)
    notes: >-
      `WorkerThreadPool` reuses engine threads and is preferred over raw
      `Thread`. Scene-tree access from a worker must go through
      `call_deferred()`.
migration:
  fromUnity: >-
    `Awaitable.BackgroundThreadAsync()` becomes `WorkerThreadPool.add_task`, but
    the ergonomics differ: Godot has no thread-hop-and-continue, so instead of
    awaiting your way back to the main thread you marshal results with
    `call_deferred()`. The main-thread-only rule for engine APIs is the same in
    both. There is no Burst/Job System equivalent — for genuinely data-parallel
    numeric work, the Godot answers are compute shaders or a GDExtension.
  fromGodot: >-
    `WorkerThreadPool` becomes `Awaitable` thread hops for one-off work, or the
    Job System for data-parallel work. `call_deferred` becomes
    `await Awaitable.MainThreadAsync()`, which reads considerably better.
related:
  - wait-for-seconds
  - load-resource
---

Both engines are single-threaded where the scene is concerned: you may compute
on other threads, but touching engine objects from them is not allowed.

## The marshalling step is the difference

Unity 6 lets you await your way onto a background thread and back:

```csharp
await Awaitable.BackgroundThreadAsync();
// heavy work
await Awaitable.MainThreadAsync();
// safe to touch the engine
```

Godot has no equivalent hop. Work runs in the task, and results come back via
`call_deferred`, which queues a call to run on the main thread at the end of the
current frame:

```gdscript
_apply_result.call_deferred(data)
```

Functionally the same, structurally split across two functions instead of one.

## call_deferred is the load-bearing primitive

Worth understanding on its own, because it appears well beyond threading. It
defers any call to the end of the frame, which is also how you safely mutate
things the engine is mid-iteration over:

```gdscript
add_child.call_deferred(node)                       # during a physics callback
$CollisionShape2D.set_deferred("disabled", true)    # see enable/disable
```

If Godot warns that something is "blocked" or "flushing queries", `call_deferred`
is usually the answer.

## Loading assets off-thread

The common case has a purpose-built API rather than a raw thread:

```gdscript
ResourceLoader.load_threaded_request(path)
# poll load_threaded_get_status(path, progress) for a loading bar
var res := ResourceLoader.load_threaded_get(path)
```

See [loading assets](/concepts/load-resource/). Reach for this before
`WorkerThreadPool` when the expensive thing is IO.

## What Godot does not have

There is no Burst compiler and no Job System. GDScript is interpreted, so
threading it gives you concurrency but not the per-core throughput Burst
provides. For heavy numeric work the options are compute shaders via
`RenderingDevice`, or dropping to C++ with a GDExtension.

This is a genuine capability gap rather than a naming difference, and worth
knowing before porting something that depends on Burst performance.
