---
title: GDScript vs. C#
category: scripting
summary: The language itself — typing, null, properties, iteration. Read this before porting any file.
mappingKind: mental-model
bindings: []
migration:
  fromUnity: >-
    GDScript is dynamically typed with optional static annotations, so the
    compiler catches far less than C# does. Annotate types (`var x: int = 0` or
    `var x := 0`) everywhere — it is not decoration, it enables real type checks,
    editor autocompletion and a meaningfully faster runtime. Godot also supports
    C# if you would rather not switch, but the ecosystem, documentation and
    community examples are overwhelmingly GDScript.
  fromGodot: >-
    C# is statically typed and compiled, so a class of errors you are used to
    seeing at runtime surfaces at build time instead. The cost is a compile step
    and a heavier edit-test loop. Expect explicit types everywhere, real
    namespaces, and `null` behaving like `null`.
related:
  - components-vs-nodes
  - singletons-autoload
  - math-and-vectors
---

Everything else in this reference assumes you can read the other side's code.
This page is the language, not the engine.

## The shape of a script

```csharp
using UnityEngine;

public class Player : MonoBehaviour
{
    [SerializeField] private float _speed = 5f;
    private int _health = 100;

    public void TakeDamage(int amount)
    {
        _health -= amount;
        if (_health <= 0) Die();
    }
}
```

```gdscript
class_name Player
extends CharacterBody2D

@export var speed: float = 5.0
var _health: int = 100

func take_damage(amount: int) -> void:
    _health -= amount
    if _health <= 0:
        die()
```

Indentation is significant — there are no braces and no semicolons. `extends`
replaces the base class in the declaration, and `class_name` is what registers
the type globally so other scripts can refer to `Player` without a path.

## Naming conventions differ, and the engine enforces some of it

| | Unity / C# | Godot / GDScript |
| --- | --- | --- |
| Methods | `PascalCase` | `snake_case` |
| Variables | `camelCase` | `snake_case` |
| Classes | `PascalCase` | `PascalCase` |
| Constants | `PascalCase` | `SCREAMING_SNAKE` |
| Signals/events | `PascalCase` | `snake_case` |
| Private | `private` keyword | `_leading_underscore` by convention |

Engine methods really are snake_case (`get_node`, `queue_free`,
`move_and_slide`), so mixed conventions read badly. Convert wholesale.

## Static typing is optional but not really

```gdscript
var a = 5              # dynamic — works, but no checks
var b: int = 5         # explicit
var c := 5             # inferred, still static
```

The `:=` form gives you the type without writing it out. Without annotations you
lose compile-time errors, autocompletion, and the optimised code path.

Treat untyped GDScript the way you would treat `dynamic` in C#: legal,
occasionally useful, not the default.

## Null is not the same

C# has `null`, nullable reference types, `?.` and `??`. GDScript has `null` and
much less machinery around it.

There is no `?.`. The idiom is an explicit check, and for freed nodes it is
`is_instance_valid()` rather than a null test — see
[destroying an object](/concepts/destroy-object/), which is the most important
consequence of this difference.

## Properties, getters, setters

```csharp
public int Health
{
    get => _health;
    set { _health = Mathf.Max(0, value); OnHealthChanged?.Invoke(); }
}
```

```gdscript
var health: int = 100:
    get:
        return health
    set(value):
        health = maxi(0, value)
        health_changed.emit()
```

Same capability, trailing-colon syntax. The setter runs on inspector edits too,
which makes it a common place to hang editor-time updates.

## Things with no direct equivalent

- **`async`/`await` over arbitrary tasks** — GDScript's `await` works on signals
  and coroutine functions, not a general task system. See
  [waiting](/concepts/wait-for-seconds/).
- **Generics** — no user-defined generics. Typed arrays (`Array[int]`) and
  dictionaries exist, but you cannot write `class Pool[T]`.
- **Interfaces** — no `interface` keyword. Duck typing plus `has_method()` is
  the usual substitute; some codebases use an abstract base `Resource`.
- **`readonly` / `const` fields** — `const` exists but must be compile-time
  constant. There is no per-instance immutability.
- **Namespaces** — `class_name` registers globally, so names must be unique
  across the project.
- **LINQ** — no equivalent. `Array` has `map`, `filter`, `reduce`, `any`, `all`
  via `Callable`, which covers common cases.

## What GDScript has that C# does not

- **`@export` annotations** that drive the inspector directly, with range, enum,
  file and group variants — see [exposing a field](/concepts/serialized-field/).
- **`$Path` and `%UniqueName`** node access as syntax, not API calls.
- **`await signal`** on any signal, with no setup.
- **Built-in engine types** — `Vector2`, `Color`, `Transform2D` are language
  primitives, not library structs.
- **`preload`** resolved at parse time — see [loading assets](/concepts/load-resource/).

## Should you use C# in Godot?

You can: Godot ships .NET support and the API surface is the same, with
PascalCase names. It is a reasonable choice if you have C# libraries to reuse or
a team that will not switch.

Be aware of the trade: most documentation, tutorials, plugins and community
answers are GDScript, the .NET build has extra export steps, and some platforms
(notably web) have historically lagged. For a project starting fresh in Godot,
GDScript is the path of least resistance.
