---
title: Playing and blending animations
category: animation
summary: Play a clip, and drive transitions between clips from game state.
mappingKind: approximate
bindings:
  - engine: unity
    symbol: UnityEngine.Animator
    signature: 'void SetTrigger(string name)'
    docsUrl: https://docs.unity3d.com/ScriptReference/Animator.html
    snippet: |
      [SerializeField] private Animator _animator;

      void Update()
      {
          // You set parameters; the AnimatorController decides what plays.
          _animator.SetFloat("Speed", _velocity.magnitude);
          _animator.SetBool("Grounded", _cc.isGrounded);
          if (_jumpPressed) _animator.SetTrigger("Jump");
      }
    notes: >-
      One component covering playback, the state machine and blending.
      Transitions are authored as a graph in the Animator window; scripts only
      push parameters in.
  - engine: godot
    symbol: AnimationPlayer.play
    signature: 'func play(name: StringName = &"", custom_blend: float = -1, custom_speed: float = 1.0, from_end: bool = false) -> void'
    docsUrl: https://docs.godotengine.org/en/4.4/classes/class_animationplayer.html#class-animationplayer-method-play
    snippet: |
      # AnimationPlayer: direct playback, named clips.
      $AnimationPlayer.play("jump")
      await $AnimationPlayer.animation_finished

      # AnimationTree: state machine and blending, when you need it.
      var sm: AnimationNodeStateMachinePlayback = \
          $AnimationTree.get("parameters/playback")
      sm.travel("jump")
      $AnimationTree.set("parameters/Move/blend_position", velocity.length())
    notes: >-
      Two nodes, deliberately separate. `AnimationPlayer` plays clips;
      `AnimationTree` adds the state machine and blend graph on top of it.
migration:
  fromUnity: >-
    Unity's Animator splits into two Godot nodes, and you often only need the
    first. If you were using an AnimatorController purely to play named clips,
    `AnimationPlayer.play("name")` replaces the whole graph — no parameters, no
    transitions, no controller asset. If you were genuinely blending or relying
    on transition rules, add an `AnimationTree`; `SetTrigger` becomes
    `travel()`, and `SetFloat` becomes setting a blend parameter by path.
  fromGodot: >-
    Both nodes collapse into one Animator plus an AnimatorController asset. Even
    to play a single clip you author a state per clip, since there is no
    direct-play equivalent short of the legacy Animation component.
related:
  - tweening
  - events-and-signals
---

Unity gives you one component that does playback, state machine and blending.
Godot separates playback from the state machine, and the split is usually a
simplification.

## Most ported code only needs AnimationPlayer

A large share of Unity Animator usage is a controller with one state per clip
and trigger parameters to switch between them. That entire structure collapses
into:

```gdscript
$AnimationPlayer.play("jump")
```

No controller asset, no parameter names, no transition graph. If your
AnimatorController has no blend trees and no transition conditions beyond "play
this now", you can delete it rather than port it.

Reach for `AnimationTree` when you actually need blend spaces, crossfade rules,
or state logic that belongs in the animation layer rather than in script.

## AnimationPlayer animates anything

This is the part that surprises people. Godot's `AnimationPlayer` is not a
skeletal animation system — it is a general keyframe engine over *any* property
of *any* node in the scene.

You can keyframe a sprite's modulate colour, a Control's anchor, an
`AudioStreamPlayer`'s pitch, a light's energy, or an exported variable on your
own script. It can also keyframe **method calls**, firing functions at specific
times on the timeline.

That makes it the standard tool for cutscenes, UI transitions and timed
sequences — work that in Unity is split between Animator, Timeline and
hand-written coroutines. For simple property moves,
[tweening](/concepts/tweening/) is often lighter, but anything authored on a
timeline belongs here.

## Animation events

Unity's Animation Events call a method by name on a component of the same
GameObject, found by reflection.

Godot uses a Call Method track: you pick the target node and method in the
editor, and the call is stored in the animation. Renaming the method breaks the
track visibly in the editor rather than silently at runtime.

`animation_finished` is a signal, so `await $AnimationPlayer.animation_finished`
sequences naturally with the [async](/concepts/wait-for-seconds/) patterns.
