---
title: Coordinate systems and units
category: scene-structure
summary: Y points the other way in 2D, Z points the other way in 3D, and 2D units are pixels. Ported math is quietly wrong until you fix this.
mappingKind: mental-model
bindings: []
migration:
  fromUnity: >-
    Three sign and scale changes, none of which produce an error. In 2D, +Y is
    **down** in Godot, so gravity is positive and jumping is negative. In 3D,
    Godot is right-handed with **-Z** as forward, so `transform.forward` becomes
    `-global_transform.basis.z`. And a 2D unit is one pixel rather than
    Unity's 100-pixels-per-unit default, so positions and speeds scale by
    roughly 100.
  fromGodot: >-
    The same three, inverted. Watch the 2D scale most: a speed of 200 that felt
    right in Godot is 200 metres per second in Unity.
related:
  - reparenting
  - character-movement
---

Nothing here throws. Ported code compiles, runs, and behaves subtly wrong —
things fall upward, characters face backwards, movement is a hundred times too
fast. Worth reading before porting any math.

## 2D: Y is flipped

| | Unity 2D | Godot 2D |
| --- | --- | --- |
| Origin | centre of the screen | top-left |
| +Y | up | **down** |
| 1 unit | 100 pixels (sprite default) | 1 pixel |

Godot 2D uses screen conventions, the same as every 2D drawing API. So:

```gdscript
velocity.y += gravity * delta   # gravity is POSITIVE, pulls down
velocity.y = -jump_force        # jumping is NEGATIVE
```

`Vector2.UP` is `(0, -1)` in Godot, and it exists precisely so you rarely have
to write the sign yourself. `up_direction` on `CharacterBody2D` defaults to it.

## 3D: handedness differs

| | Unity 3D | Godot 3D |
| --- | --- | --- |
| Handedness | left-handed | **right-handed** |
| Forward | `+Z` | **`-Z`** |
| Up | `+Y` | `+Y` |
| 1 unit | 1 metre | 1 metre |

Up and scale agree, which makes the forward flip easy to miss.

```csharp
// Unity
transform.Translate(Vector3.forward * speed * Time.deltaTime);
```

```gdscript
# Godot — basis.z points BACKWARD, so negate it
position += -global_transform.basis.z * speed * delta
```

Imported models are usually handled for you — Godot flips on import — but
hand-written direction math is not.

## Rotations

Unity takes Euler angles in **degrees**; Godot's `rotation` is in **radians**,
with a `rotation_degrees` property when you want the other. Mixing them produces
objects spinning about 57 times too fast, which at least is obvious.

`deg_to_rad()` and `rad_to_deg()` are the conversions, and exported angle
properties are commonly declared with `@export_range` in degrees and converted
on use.

## Practical advice

Do not port math by find-and-replace. Port the *intent*: write
`velocity += Vector2.DOWN * gravity` rather than transcribing a sign, and use
`basis` helpers rather than raw axis indices. Code written in terms of named
directions survives the move; code written in terms of raw signs does not.
