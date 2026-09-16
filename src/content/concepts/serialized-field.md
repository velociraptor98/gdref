---
title: Expose a field in the editor
category: serialization
summary: Make a script variable editable in the inspector and saved with the scene.
mappingKind: direct
bindings:
  - engine: unity
    symbol: UnityEngine.SerializeField
    signature: '[SerializeField] private float _speed = 5f;'
    docsUrl: https://docs.unity3d.com/ScriptReference/SerializeField.html
    snippet: |
      [SerializeField] private float _speed = 5f;
      [SerializeField, Range(0f, 1f)] private float _damping = 0.2f;
      [SerializeField] private Transform _target;
    notes: >-
      Keeps the field private to other code while still serialized. Public
      fields serialize automatically, which is why `[SerializeField]` plus
      `private` is the common idiom.
  - engine: godot
    symbol: '@export'
    signature: '@export var speed: float = 5.0'
    docsUrl: https://docs.godotengine.org/en/4.4/tutorials/scripting/gdscript/gdscript_exports.html
    snippet: |
      @export var speed: float = 5.0
      @export_range(0.0, 1.0) var damping: float = 0.2
      @export var target: Node3D
    notes: >-
      Requires a type, either annotated or inferred from the default. An
      untyped `@export var x` will not compile.
migration:
  fromUnity: >-
    `[SerializeField]` becomes `@export`, and `[Range]` becomes
    `@export_range`. The visibility pairing inverts: GDScript has no private
    keyword, so the convention is a leading underscore, and `@export` alone is
    the whole declaration.
  fromGodot: >-
    `@export` becomes `[SerializeField]`, and you will want an explicit
    `private` alongside it.
related:
  - initialization
---

Both engines solve the same problem the same way: an annotation that promotes a
script field into editor-editable, scene-serialized data.

The attribute families line up closely too — ranges, enums, file paths,
multiline strings and grouping all exist on both sides under different spellings.
