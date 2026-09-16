---
title: Destroying an object
category: scene-structure
summary: Remove an object from the running scene and release it.
mappingKind: approximate
bindings:
  - engine: unity
    symbol: UnityEngine.Object.Destroy
    signature: 'static void Destroy(Object obj, float t = 0.0f)'
    docsUrl: https://docs.unity3d.com/ScriptReference/Object.Destroy.html
    snippet: |
      void OnHit()
      {
          Destroy(gameObject);        // end of the current frame
          Destroy(gameObject, 2f);    // after a delay
      }

      void Update()
      {
          // Destroyed objects compare equal to null, even though the C#
          // reference is still alive. This check works.
          if (_target == null) return;
      }
    notes: >-
      Deferred to the end of the frame. Unity overloads `==` so a destroyed
      object compares equal to `null`, which is convenient but means `?.` and
      `is null` do **not** agree with `== null`.
  - engine: godot
    symbol: Node.queue_free
    signature: 'func queue_free() -> void'
    docsUrl: https://docs.godotengine.org/en/4.4/classes/class_node.html#class-node-method-queue-free
    snippet: |
      func on_hit() -> void:
          queue_free()   # end of the current frame

      func _process(_delta: float) -> void:
          # A freed node is not null — the reference is dangling.
          if not is_instance_valid(target):
              target = null
              return
    notes: >-
      `queue_free()` defers to the end of the frame. `free()` is immediate and
      will crash anything still using the node this frame — `queue_free` is
      almost always what you want.
migration:
  fromUnity: >-
    `Destroy(gameObject)` becomes `queue_free()`, but the null check does not
    carry over. Godot does not fake null: a reference to a freed node is
    dangling, and testing it with `if target:` can pass while any access errors.
    Use `is_instance_valid(target)`, or connect to the node's `tree_exited`
    signal and clear the reference there.
  fromGodot: >-
    `queue_free()` becomes `Destroy(gameObject)`. You gain the fake-null
    behaviour, so `if (target == null)` is reliable — but only with `==`, not
    with `?.` or pattern matching.
related:
  - spawn-object
  - find-nodes
---

Same deferral model — both engines queue the removal until the end of the frame
so the rest of the frame can finish safely.

The difference is what happens to references afterwards, and it is the kind of
difference that produces intermittent bugs rather than errors.

## Unity fakes null. Godot does not.

Unity's `Object` overloads `==` so a destroyed object reports itself as null.
The C# reference is still a live object; Unity is lying to you helpfully. The
catch is that only `==` participates — `obj?.Foo()` and `obj is null` see the
real, non-null reference and will happily proceed.

Godot has no such mechanism. After `queue_free()`, a variable holding that node
is dangling. `if target:` may still evaluate truthy, and touching it produces an
error about a previously freed instance. The tools are:

- **`is_instance_valid(node)`** — the direct check.
- **`node.tree_exited`** — connect and null your reference, which is cleaner
  when the reference is long-lived.
- **Weak references** via `weakref()` when you genuinely want to observe
  without keeping it alive.

## free() vs queue_free()

`free()` destroys immediately, mid-frame, while signals may be in flight and
other nodes may be iterating the tree. It has no real Unity equivalent —
`DestroyImmediate` is editor-only and similarly discouraged. Reach for
`queue_free()` unless you have a specific reason not to.
