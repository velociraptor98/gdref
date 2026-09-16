---
title: Timers and repeating calls
category: async
summary: Run something after a delay, or every N seconds, without writing a countdown by hand.
mappingKind: approximate
bindings:
  - engine: unity
    symbol: UnityEngine.MonoBehaviour.Invoke
    signature: 'void InvokeRepeating(string methodName, float time, float repeatRate)'
    docsUrl: https://docs.unity3d.com/ScriptReference/MonoBehaviour.InvokeRepeating.html
    snippet: |
      void Start()
      {
          InvokeRepeating(nameof(SpawnEnemy), 1f, 2f);  // string-based
      }

      // Modern alternative: an async loop.
      async Awaitable SpawnLoop(CancellationToken ct)
      {
          while (!ct.IsCancellationRequested)
          {
              await Awaitable.WaitForSecondsAsync(2f, ct);
              SpawnEnemy();
          }
      }
    notes: >-
      `Invoke` and `InvokeRepeating` take method names as strings, so renaming
      breaks them silently. An `Awaitable` loop is the modern, refactor-safe
      form.
  - engine: godot
    symbol: Timer
    signature: 'func start(time_sec: float = -1) -> void'
    docsUrl: https://docs.godotengine.org/en/4.4/classes/class_timer.html
    snippet: |
      # A Timer node — configured in the editor, emits a signal.
      func _ready() -> void:
          $SpawnTimer.wait_time = 2.0
          $SpawnTimer.one_shot = false
          $SpawnTimer.timeout.connect(_spawn_enemy)
          $SpawnTimer.start()

      # Or a throwaway one-shot with no node.
      await get_tree().create_timer(2.0).timeout
    notes: >-
      A real node, so it appears in the scene, pauses with the tree, and is
      inspectable at runtime. `one_shot = false` makes it repeat.
migration:
  fromUnity: >-
    `InvokeRepeating` becomes a `Timer` node with `one_shot = false`, connected
    to a method. The string-based method name disappears, so renames are safe.
    `CancelInvoke` becomes `stop()`. A one-off delay with no repetition does not
    need a node at all — `await get_tree().create_timer(n).timeout` covers it.
  fromGodot: >-
    A Timer node becomes either `InvokeRepeating` or, preferably in Unity 6, an
    `Awaitable` loop with a CancellationToken. You lose the editor-visible,
    inspectable timer and take on cancellation bookkeeping yourself.
related:
  - wait-for-seconds
  - enable-disable
  - events-and-signals
---

Godot models a timer as a node. That sounds heavyweight and turns out to be the
useful part: it is visible in the scene tree, editable in the inspector,
inspectable while the game runs, and it participates in the pause system
automatically.

## Three options, in rough order of preference

**A `Timer` node** when the timer is part of the object's design — a spawner's
interval, a weapon cooldown, a respawn delay. Configure `wait_time` and
`one_shot` in the inspector, connect `timeout`, call `start()`.

**`get_tree().create_timer(n)`** for a throwaway one-shot inside a function.
No node, no cleanup, awaitable inline. See
[waiting for a duration](/concepts/wait-for-seconds/).

**A counter in `_process`** when you need to read the remaining time every frame
anyway — though `$Timer.time_left` usually removes that need.

## Pausing comes free

A `Timer` node obeys `process_mode` like any other node, so pausing the tree
pauses the timer. A cooldown does not tick away while the game is paused, with
no special handling.

`create_timer()` defaults the other way — its `process_always` parameter is
`true`, so it keeps running while paused unless you pass `false`. That asymmetry
is worth knowing when a "3 second respawn" fires during a pause menu.

## Cooldowns without a countdown variable

The common Unity pattern of a `_cooldownRemaining` float decremented in `Update`
has a tidier form:

```gdscript
func fire() -> void:
    if not $CooldownTimer.is_stopped():
        return
    _shoot()
    $CooldownTimer.start()
```

The timer holds the state, the inspector shows the duration, and there is no
per-frame arithmetic.

## Godot 4 removed the `yield`-era awkwardness

In Godot 3 this area was genuinely clumsy. In Godot 4, `Timer.timeout` and
`SceneTreeTimer.timeout` are both awaitable signals, so timers compose with the
rest of the [async](/concepts/wait-for-seconds/) model rather than sitting
outside it.
