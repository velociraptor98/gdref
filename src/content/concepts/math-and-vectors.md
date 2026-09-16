---
title: Math and vectors
category: scripting
summary: Lerp, clamp, distance, dot products — where the helpers live and what they are called.
mappingKind: direct
bindings:
  - engine: unity
    symbol: UnityEngine.Mathf
    signature: 'static float Lerp(float a, float b, float t)'
    docsUrl: https://docs.unity3d.com/ScriptReference/Mathf.html
    snippet: |
      float t = Mathf.Clamp01(elapsed / duration);
      float x = Mathf.Lerp(start, end, t);
      float a = Mathf.MoveTowards(current, target, speed * Time.deltaTime);

      Vector3 v = Vector3.Lerp(a, b, t);
      float d   = Vector3.Distance(a, b);
      float dot = Vector3.Dot(a.normalized, b.normalized);
    notes: >-
      Scalar helpers live on `Mathf`; vector helpers are static methods on the
      vector types.
  - engine: godot
    symbol: '@GlobalScope'
    signature: 'func lerp(from: Variant, to: Variant, weight: float) -> Variant'
    docsUrl: https://docs.godotengine.org/en/4.4/classes/class_@globalscope.html
    snippet: |
      var t := clampf(elapsed / duration, 0.0, 1.0)
      var x := lerpf(start, end, t)
      var a := move_toward(current, target, speed * delta)

      var v := a.lerp(b, t)          # method ON the vector
      var d := a.distance_to(b)
      var dot := a.normalized().dot(b.normalized())
    notes: >-
      Scalar helpers are global functions — no prefix. Vector helpers are
      **methods on the vector instance**, not statics.
migration:
  fromUnity: >-
    Drop the `Mathf.` prefix and convert to snake_case: `Mathf.Clamp` becomes
    `clamp`, `Mathf.MoveTowards` becomes `move_toward` (note the singular).
    Vector operations invert from static to instance form —
    `Vector3.Distance(a, b)` becomes `a.distance_to(b)`, `Vector3.Lerp(a, b, t)`
    becomes `a.lerp(b, t)`. Trigonometry takes **radians**, so anything using
    `Mathf.Sin` on a degree value needs `deg_to_rad`.
  fromGodot: >-
    Add the `Mathf.` prefix and PascalCase. Vector instance methods become
    statics on the vector type. Angles stay in radians for trig but Unity's
    Transform APIs take degrees, so conversions move to the boundary.
related:
  - coordinate-systems
  - random-numbers
---

The same standard library under different organisation. Nothing here is missing
on either side; it is a lookup problem.

## Scalars: global functions vs. a static class

```gdscript
clamp(x, 0.0, 1.0)      # or clampf / clampi for typed versions
lerp(a, b, t)           # or lerpf
abs(x)   min(a, b)   max(a, b)   round(x)   floor(x)   snapped(x, step)
```

The `f` and `i` suffixed variants (`clampf`, `lerpf`, `maxi`) are typed and
faster — worth preferring in annotated code, since the untyped forms go through
`Variant`.

## Vectors: methods, not statics

The inversion catches everyone at least once:

| Unity | Godot |
| --- | --- |
| `Vector3.Distance(a, b)` | `a.distance_to(b)` |
| `Vector3.Lerp(a, b, t)` | `a.lerp(b, t)` |
| `Vector3.Dot(a, b)` | `a.dot(b)` |
| `Vector3.Cross(a, b)` | `a.cross(b)` |
| `a.normalized` (property) | `a.normalized()` (method) |
| `a.magnitude` | `a.length()` |
| `a.sqrMagnitude` | `a.length_squared()` |

`normalized` being a property in Unity and a method in Godot is a small thing
that produces a confusing error message.

## Naming gotchas

- **`move_toward`**, not `move_towards`. Exists on floats and on vectors.
- **`lerp_angle`** wraps correctly around a full turn — the equivalent of
  `Mathf.LerpAngle`.
- **`is_equal_approx`** for float comparison, replacing `Mathf.Approximately`.
- **`inverse_lerp`** and **`remap`** are built in; `remap` has no Unity
  counterpart and replaces the usual hand-written two-range conversion.
- **`snapped`** rounds to a step, replacing `Mathf.Round(x / s) * s`.

## Angles are radians

`sin`, `cos`, `atan2` and the `rotation` property all work in radians. Unity's
`Mathf` trig is radians too, but its Transform API is degrees, so Unity code
tends to carry degrees around and convert late.

Godot gives you `rotation` (radians) and `rotation_degrees` (degrees) as
separate properties on the same node, so pick one and stay in it.
`deg_to_rad()` and `rad_to_deg()` handle the boundary. `TAU` is built in and is
usually clearer than `2 * PI` for full-turn math.
