---
title: Initialization
category: lifecycle
summary: Run setup code once, when the object enters the running scene.
mappingKind: approximate
bindings:
  - engine: unity
    symbol: UnityEngine.MonoBehaviour.Start
    signature: void Start()
    docsUrl: https://docs.unity3d.com/ScriptReference/MonoBehaviour.Start.html
    snippet: |
      void Awake()
      {
          // Self-setup. Runs even if the component is disabled.
          _rb = GetComponent<Rigidbody>();
      }

      void Start()
      {
          // Cross-object setup. Every Awake in the scene has already run.
          _target = GameObject.FindWithTag("Player").transform;
      }
    notes: >-
      Two hooks, and the split matters: Awake for wiring up yourself, Start for
      anything that reaches outside. Start is skipped entirely while the
      component is disabled.
  - engine: godot
    symbol: Node._ready
    signature: func _ready() -> void
    docsUrl: https://docs.godotengine.org/en/4.4/classes/class_node.html#class-node-private-method-ready
    snippet: |
      func _ready() -> void:
          # Children are guaranteed ready before the parent.
          target = get_node("../Player")
    notes: >-
      One hook. Godot orders it bottom-up — every child's `_ready` has completed
      before the parent's runs, which covers most of what Unity's Awake/Start
      split exists to solve.
migration:
  fromUnity: >-
    Collapse both into `_ready`. The Awake/Start distinction mostly disappears
    because Godot's bottom-up ordering already guarantees children are
    initialized. If you genuinely need pre-tree setup, use `_init`, but note it
    runs before the node is in the tree, so `get_node` will fail there.
  fromGodot: >-
    Split it. Anything calling `GetComponent` on yourself goes in Awake;
    anything looking up another object goes in Start. Collapsing both into
    Start works until something disables the component.
related:
  - per-frame-update
  - components-vs-nodes
---

Both engines give you a hook that fires once when the object becomes live. The
difference is how many hooks, and why.

Unity's split exists because there is no ordering guarantee between objects.
`Awake` is the phase where every object gets itself in order; by `Start`, the
whole scene has finished its `Awake` pass, so reaching across objects is safe.

Godot solves the same problem with tree ordering instead of phases. `_ready`
propagates bottom-up, so by the time a parent runs, its entire subtree is
initialized. Reaching *down* is always safe. Reaching *up* or sideways is the
case that still bites — the parent may not be ready yet — and `await
owner.ready` is the usual fix.
