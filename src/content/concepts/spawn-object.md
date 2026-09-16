---
title: Spawn an object at runtime
category: scene-structure
summary: Clone a saved object or scene and add it to the running world.
mappingKind: approximate
bindings:
  - engine: unity
    symbol: UnityEngine.Object.Instantiate
    signature: static T Instantiate<T>(T original, Vector3 position, Quaternion rotation)
    docsUrl: https://docs.unity3d.com/ScriptReference/Object.Instantiate.html
    snippet: |
      [SerializeField] private GameObject _bulletPrefab;

      void Fire()
      {
          // Cloned and parented to the scene root in one call.
          Instantiate(_bulletPrefab, muzzle.position, muzzle.rotation);
      }
    notes: >-
      One call clones and inserts. Pass a Transform as a third argument to
      parent it somewhere specific.
  - engine: godot
    symbol: PackedScene.instantiate
    signature: 'func instantiate(edit_state: PackedScene.GenEditState = 0) -> Node'
    docsUrl: https://docs.godotengine.org/en/4.4/classes/class_packedscene.html#class-packedscene-method-instantiate
    snippet: |
      @export var bullet_scene: PackedScene

      func fire() -> void:
          var bullet := bullet_scene.instantiate()
          # Two steps: the node exists but is not in the tree yet.
          get_tree().current_scene.add_child(bullet)
          bullet.global_transform = muzzle.global_transform
    notes: >-
      `instantiate()` creates the node but does not add it anywhere. Nothing
      runs — no `_ready`, no `_process` — until `add_child`.
migration:
  fromUnity: >-
    The single call becomes two, and the gap between them is useful: the node
    exists but is inert, so you can set exported properties before `_ready`
    fires. Setting `global_transform` before `add_child` does not stick, though
    — set it after.
  fromGodot: >-
    Collapses into one `Instantiate` call. You lose the configure-before-live
    window; the usual replacement is an initializer method called immediately
    after, accepting that Awake has already run.
related:
  - prefabs-vs-packed-scenes
  - components-vs-nodes
---

Same operation, split differently. Unity clones and inserts in one call; Godot
separates instantiation from insertion.

That separation is the detail worth internalizing. Between `instantiate()` and
`add_child()`, the node is a real object that is not yet alive: no lifecycle
callbacks have fired, nothing is processing. It is the natural place to inject
dependencies, and it has no clean Unity equivalent.
