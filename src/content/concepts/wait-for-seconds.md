---
title: Wait for a duration
category: async
summary: Pause an operation for a period of time without blocking the frame.
mappingKind: direct
bindings:
  - engine: unity
    symbol: UnityEngine.Awaitable.WaitForSecondsAsync
    signature: static Awaitable WaitForSecondsAsync(float seconds, CancellationToken ct = default)
    docsUrl: https://docs.unity3d.com/ScriptReference/Awaitable.WaitForSecondsAsync.html
    snippet: |
      async Awaitable Dash()
      {
          _isDashing = true;
          await Awaitable.WaitForSecondsAsync(0.2f);
          _isDashing = false;
      }
    notes: >-
      Resumes on the main thread on a subsequent frame, in scaled time. Pass a
      CancellationToken if the object may be destroyed mid-wait.
  - engine: godot
    symbol: SceneTree.create_timer
    signature: 'func create_timer(time_sec: float, process_always: bool = true, process_in_physics: bool = false, ignore_time_scale: bool = false) -> SceneTreeTimer'
    docsUrl: https://docs.godotengine.org/en/4.4/classes/class_scenetree.html#class-scenetree-method-create-timer
    snippet: |
      func dash() -> void:
          is_dashing = true
          await get_tree().create_timer(0.2).timeout
          is_dashing = false
    notes: >-
      Awaits a one-shot timer's `timeout` signal. The timer holds no reference
      to the node, so if the node frees mid-wait the resumption is discarded.
migration:
  fromUnity: >-
    Almost a transliteration under Unity 6. Coroutines were the awkward case;
    `Awaitable` and `await` line up directly. Note that Godot's default timer
    ignores pause, whereas Unity's scaled wait stops when timescale is zero.
  fromGodot: >-
    `await Awaitable.WaitForSecondsAsync(n)`, and add a CancellationToken if the
    object can be destroyed while waiting.
related:
  - next-frame
---

Choosing modern Unity makes this a clean pair. `StartCoroutine` and
`yield return new WaitForSeconds(0.2f)` never mapped well onto `await` — a
coroutine is a driven iterator, not a task. `Awaitable` is genuinely awaitable,
so both sides are now `await` an expression.

The remaining difference is lifetime safety. Unity wants an explicit
CancellationToken; Godot's SceneTreeTimer holds no strong reference to the
awaiting node, so a freed node simply never resumes.
