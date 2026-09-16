---
title: Cleanup and teardown
category: lifecycle
summary: Run code when an object goes away — unsubscribe, release, save.
mappingKind: approximate
bindings:
  - engine: unity
    symbol: UnityEngine.MonoBehaviour.OnDestroy
    signature: 'void OnDestroy()'
    docsUrl: https://docs.unity3d.com/ScriptReference/MonoBehaviour.OnDestroy.html
    snippet: |
      void OnEnable()  => _input.Jump.performed += OnJump;
      void OnDisable() => _input.Jump.performed -= OnJump;

      void OnDestroy()
      {
          _handle.Release();
          SaveProgress();
      }

      void OnApplicationQuit() { }   // app closing
    notes: >-
      `OnDisable` fires on deactivation *and* just before destruction, so
      subscribe/unsubscribe pairs live in OnEnable/OnDisable rather than
      Awake/OnDestroy.
  - engine: godot
    symbol: Node._exit_tree
    signature: 'func _exit_tree() -> void'
    docsUrl: https://docs.godotengine.org/en/4.4/classes/class_node.html#class-node-private-method-exit-tree
    snippet: |
      func _exit_tree() -> void:
          # Leaving the tree — may be a reparent, not a destruction.
          save_progress()

      func _notification(what: int) -> void:
          if what == NOTIFICATION_PREDELETE:
              # Actually being freed.
              _handle.release()
          elif what == NOTIFICATION_WM_CLOSE_REQUEST:
              get_tree().quit()
    notes: >-
      `_exit_tree` means "removed from the tree", which is not necessarily
      "destroyed" — a `reparent()` fires it too. `NOTIFICATION_PREDELETE` is the
      real destructor hook.
migration:
  fromUnity: >-
    `OnDestroy` splits. `_exit_tree` is the usual place, but it fires on
    reparenting as well as destruction, so anything that must happen exactly
    once at end-of-life belongs in `NOTIFICATION_PREDELETE`. The
    OnEnable/OnDisable subscribe pattern is mostly unnecessary: Godot
    disconnects signals automatically when either party is freed, so manual
    unsubscription is rarely needed.
  fromGodot: >-
    `_exit_tree` becomes `OnDestroy`, and you take on manual unsubscription —
    C# events hold strong references and will keep destroyed objects alive if
    you do not unsubscribe.
related:
  - destroy-object
  - initialization
  - events-and-signals
---

Both engines call you before an object goes away. The interesting difference is
how much cleanup you actually have to write.

## Signals clean themselves up

The single biggest reduction in ceremony. In Unity, a C# event holds a strong
reference to its subscriber, so failing to unsubscribe leaks the destroyed
object and can invoke callbacks on it. Hence the OnEnable/OnDisable discipline.

Godot tracks connections on both ends. When either the emitter or the receiver
is freed, the connection is removed. Most Godot code never disconnects anything.

You still disconnect deliberately when the *logic* requires it — a one-shot that
should stop listening after firing — and `CONNECT_ONE_SHOT` handles that case
directly.

## Leaving the tree is not dying

`_exit_tree` fires whenever the node leaves the scene tree, including:

- being freed
- `remove_child()` without freeing
- `reparent()` — which is a remove and an add

So `_exit_tree` is the wrong place for "release this resource forever". Use it
for things that should pause when detached, and use `NOTIFICATION_PREDELETE`
for genuine end-of-life:

```gdscript
func _notification(what: int) -> void:
    if what == NOTIFICATION_PREDELETE:
        _really_clean_up()
```

There is a matching `_enter_tree`, which fires before `_ready` and fires again
on every re-entry — whereas `_ready` fires once by default.

## Application quit

| | Unity | Godot |
| --- | --- | --- |
| Quitting | `OnApplicationQuit` | `NOTIFICATION_WM_CLOSE_REQUEST` |
| Focus lost | `OnApplicationFocus` | `NOTIFICATION_APPLICATION_FOCUS_OUT` |
| Paused (mobile) | `OnApplicationPause` | `NOTIFICATION_APPLICATION_PAUSED` |

Godot routes these through `_notification` rather than named callbacks. For the
close request you also need `get_tree().set_auto_accept_quit(false)` if you want
to intervene — otherwise the window closes before your handler is useful, which
is the usual reason a "save on quit" handler appears not to run.
