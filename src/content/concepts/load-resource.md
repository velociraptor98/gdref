---
title: Loading assets at runtime
category: assets
summary: Pull a prefab, texture or data asset in from disk by path rather than wiring it in the editor.
mappingKind: approximate
bindings:
  - engine: unity
    symbol: UnityEngine.AddressableAssets
    signature: 'Task<T> LoadAssetAsync<T>(object key)'
    docsUrl: https://docs.unity3d.com/Packages/com.unity.addressables@latest/index.html?subfolder=/manual/load-assets.html
    snippet: |
      // Addressables is the modern path — async, with explicit release.
      var handle = Addressables.LoadAssetAsync<GameObject>("Enemies/Slime");
      var prefab = await handle.Task;
      Instantiate(prefab);
      Addressables.Release(handle);
    notes: >-
      Requires the Addressables package and marking assets as addressable.
      `Resources.Load` still works but is discouraged: everything in a
      `Resources/` folder ships in the build whether used or not.
  - engine: godot
    symbol: ResourceLoader.load
    signature: 'func load(path: String, type_hint: String = "", cache_mode: ResourceLoader.CacheMode = 1) -> Resource'
    docsUrl: https://docs.godotengine.org/en/4.4/classes/class_resourceloader.html#class-resourceloader-method-load
    snippet: |
      # Compile time: path must be a literal, resolved at load, never fails late.
      const SLIME := preload("res://enemies/slime.tscn")

      # Runtime: path can be computed.
      var scene := load("res://enemies/%s.tscn" % enemy_id)
      add_child(scene.instantiate())

      # Large assets, without stalling the frame.
      ResourceLoader.load_threaded_request(path)
    notes: >-
      `preload` and `load` both return cached instances — loading the same path
      twice gives you the same object. No release call; resources are
      reference-counted.
migration:
  fromUnity: >-
    `Resources.Load` maps almost exactly onto `load()`, and `res://` paths
    include the extension where Unity's do not. The genuinely new tool is
    `preload`, which has no Unity counterpart: it resolves at parse time, so a
    broken path is a load-time error rather than a null at runtime. Use it
    wherever the path is a constant. Memory management also goes away —
    reference counting replaces Addressables' acquire/release handles.
  fromGodot: >-
    `load()` becomes an Addressables load plus a `Release` when finished. There
    is no `preload`, so constant paths become serialized fields wired in the
    Inspector — which is the idiomatic Unity answer anyway.
related:
  - scriptable-objects
  - spawn-object
  - scene-loading
---

Both engines would rather you wired references in the editor. Both provide a
path-based escape hatch for the cases where you cannot — data-driven spawning,
modding, content chosen at runtime.

## preload has no Unity equivalent

The most useful thing here, and the one with no counterpart:

```gdscript
const SLIME := preload("res://enemies/slime.tscn")
```

`preload` runs when the *script* loads, not when the line executes. The path
must be a literal. In exchange, a typo is caught at load time rather than
surfacing as a null reference during play, and there is no runtime cost at the
call site.

The rule of thumb: constant path, use `preload`; computed path, use `load`.

## Memory management differs sharply

Addressables makes you hold a handle and call `Release`. Forget it and you leak;
release too early and you get a dangling reference. It is explicit because
Unity cannot know when you are done.

Godot reference-counts `Resource`. When the last reference drops, it unloads.
There is no release call and no leak to forget — but also less control, and a
cached resource stays resident as long as anything holds it.

## Why Resources.Load is out of scope

`Resources.Load` still functions, and it is the closer literal match to
Godot's `load()`. It is out of scope here because everything in a `Resources/`
folder is packed into the build unconditionally and loaded eagerly at startup,
which is exactly the problem Addressables exists to fix. It is indexed as a
[legacy symbol](/legacy/resources-load/) so searching for it lands somewhere
useful.
