---
title: Events and signals
category: events
summary: Let an object announce something happened without knowing who is listening.
mappingKind: approximate
bindings:
  - engine: unity
    symbol: UnityEngine.Events.UnityEvent
    signature: class UnityEvent
    docsUrl: https://docs.unity3d.com/ScriptReference/Events.UnityEvent.html
    snippet: |
      // Inspector-wireable, serialized with the scene.
      [SerializeField] private UnityEvent<int> _onDamaged;

      // Or a plain C# event: faster, code-only, not visible in the editor.
      public event Action<int> Damaged;

      void TakeDamage(int amount)
      {
          _onDamaged.Invoke(amount);
          Damaged?.Invoke(amount);
      }
    notes: >-
      Two mechanisms with different trade-offs. UnityEvent is serialized and
      wireable in the Inspector; a C# event is faster and type-safe but
      invisible to designers.
  - engine: godot
    symbol: Signal.emit
    signature: 'signal damaged(amount: int)'
    docsUrl: https://docs.godotengine.org/en/4.4/tutorials/scripting/gdscript/gdscript_basics.html#signals
    snippet: |
      signal damaged(amount: int)

      func take_damage(amount: int) -> void:
          damaged.emit(amount)

      # Connecting, from either code or the editor's Node dock.
      health.damaged.connect(_on_health_damaged)
    notes: >-
      One mechanism covering both cases: connectable from code and from the
      editor, serialized with the scene either way.
migration:
  fromUnity: >-
    Both of your mechanisms collapse into `signal`. The decision you no longer
    have to make is UnityEvent versus C# event — a Godot signal is editor-
    wireable and code-connectable at once. Connections made in the editor are
    stored in the scene file, just as UnityEvent wiring is.
  fromGodot: >-
    Pick one. If designers need to wire it, `UnityEvent`. If it is code-only and
    on a hot path, a C# `event`. Some codebases expose both.
related:
  - initialization
---

Godot's signals cover in one feature what Unity splits across two, and the
split is the thing to understand when porting.

`UnityEvent` exists to be serialized and wired in the Inspector, at the cost of
speed and compile-time safety. A C# `event` is the opposite. Godot signals are
serialized, editor-wireable, *and* the idiomatic code path, so the choice does
not arise.

One-shot connections and `await`ing a signal directly are conveniences Godot
has that need hand-rolling on the Unity side.
