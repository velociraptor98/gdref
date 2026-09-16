---
title: Tween a property over time
category: animation
summary: Animate a value from A to B over a duration with an easing curve.
mappingKind: none
gap: >-
  Unity ships no first-party tweening API. The ecosystem standard is DOTween,
  with PrimeTween a newer allocation-free alternative. Both are mature and very
  widely used; neither is made by Unity.
bindings:
  - engine: godot
    symbol: Tween.tween_property
    signature: 'func tween_property(object: Object, property: NodePath, final_val: Variant, duration: float) -> PropertyTweener'
    docsUrl: https://docs.godotengine.org/en/4.4/classes/class_tween.html#class-tween-method-tween-property
    snippet: |
      func pop() -> void:
          var tween := create_tween()
          tween.set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
          tween.tween_property(self, "scale", Vector2.ONE * 1.2, 0.15)
          tween.tween_property(self, "scale", Vector2.ONE, 0.1)
          await tween.finished
    notes: >-
      Built in, no dependency. Tweens are bound to the node that created them
      and are cleaned up automatically when it frees.
migration:
  fromUnity: >-
    If you were using DOTween, `create_tween()` will feel familiar — the
    chained, sequenced API is close in spirit. The main change is that Godot
    tweens are one-shot by default and tied to the creating node's lifetime.
  fromGodot: >-
    There is nothing built in to move to. Add DOTween or PrimeTween from the
    Asset Store or a package. Coroutines or `Awaitable` plus a manual `Lerp`
    work for simple cases but get unwieldy past a couple of sequenced steps.
related:
  - wait-for-seconds
---

A genuine gap rather than a translation, and worth stating plainly: Unity has
no first-party equivalent to Godot's `Tween`.

In practice this is rarely felt, because DOTween is so widely adopted that it
functions as a de facto standard. But it is a dependency decision a Godot
developer moving to Unity has to make, and knowing that up front beats
discovering it while looking for a built-in that does not exist.

The reverse direction is easier: Godot's tween API covers most of what DOTween
is typically used for, without the dependency.
