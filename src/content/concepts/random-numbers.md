---
title: Random numbers
category: scripting
summary: Random values, random picks, and seeding for reproducible runs.
mappingKind: direct
bindings:
  - engine: unity
    symbol: UnityEngine.Random
    signature: 'static float Range(float minInclusive, float maxInclusive)'
    docsUrl: https://docs.unity3d.com/ScriptReference/Random.html
    snippet: |
      float damage = Random.Range(8f, 12f);      // max INCLUSIVE for floats
      int index    = Random.Range(0, list.Count); // max EXCLUSIVE for ints
      var dir      = Random.insideUnitCircle.normalized;

      Random.InitState(12345);   // reproducible
    notes: >-
      The int and float overloads differ on whether the upper bound is
      included — a long-standing source of off-by-one bugs.
  - engine: godot
    symbol: RandomNumberGenerator
    signature: 'func randf_range(from: float, to: float) -> float'
    docsUrl: https://docs.godotengine.org/en/4.4/classes/class_randomnumbergenerator.html
    snippet: |
      var damage := randf_range(8.0, 12.0)   # both ends inclusive
      var index := randi_range(0, list.size() - 1)  # both ends INCLUSIVE
      var pick = list.pick_random()
      var dir := Vector2.RIGHT.rotated(randf() * TAU)

      seed(12345)   # reproducible, global generator
    notes: >-
      The global functions are on `@GlobalScope`, so no prefix is needed.
      `randi_range` is inclusive at **both** ends, unlike Unity's int overload.
migration:
  fromUnity: >-
    `Random.Range(0, n)` becomes `randi_range(0, n - 1)`. This is the one that
    silently breaks: Unity's int form excludes the upper bound, Godot's includes
    it, so a direct translation indexes one past the end of the array roughly
    once every n calls. `Random.Range(a, b)` for floats maps straight onto
    `randf_range(a, b)` — both inclusive. And `list[Random.Range(0, list.Count)]`
    has a better form: `list.pick_random()`.
  fromGodot: >-
    `randi_range(a, b)` becomes `Random.Range(a, b + 1)`. `pick_random()` has no
    equivalent and becomes an indexed access.
related:
  - math-and-vectors
---

Same capability, one dangerous difference in the boundaries.

## The inclusive/exclusive table

| Call | Lower | Upper |
| --- | --- | --- |
| `Random.Range(int, int)` | inclusive | **exclusive** |
| `Random.Range(float, float)` | inclusive | inclusive |
| `randi_range(int, int)` | inclusive | **inclusive** |
| `randf_range(float, float)` | inclusive | inclusive |

Unity's own inconsistency between its int and float overloads is the reason
people get this wrong in both directions. Godot is at least internally
consistent.

The safest ports:

```gdscript
# Unity: Random.Range(0, array.Count)
var i := randi_range(0, array.size() - 1)

# Better still, when you just want an element:
var item = array.pick_random()
```

## Seeding

Both engines have one global generator you can seed, and both support separate
generator instances when you need independent streams.

```gdscript
seed(12345)                      # global

var rng := RandomNumberGenerator.new()
rng.seed = 12345                 # independent stream
var x := rng.randf_range(0.0, 1.0)
```

The instance form matters for procedural generation, where you want world
generation reproducible from a seed while gameplay randomness stays
unpredictable. `randomize()` reseeds the global generator from the system clock;
Godot calls it automatically at startup, so unlike Unity you do not need to.

## Useful extras

`pick_random()` on arrays, `TAU` as a built-in constant (handy for random
directions), and `randfn(mean, deviation)` for a normal distribution, which
Unity lacks entirely.
