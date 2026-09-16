---
title: Loading and switching scenes
category: assets
summary: Move from one level or menu to another, or layer one on top of the current world.
mappingKind: approximate
bindings:
  - engine: unity
    symbol: UnityEngine.SceneManagement.SceneManager
    signature: 'static void LoadScene(string sceneName, LoadSceneMode mode)'
    docsUrl: https://docs.unity3d.com/ScriptReference/SceneManagement.SceneManager.LoadScene.html
    snippet: |
      // Replace the current scene.
      SceneManager.LoadScene("Level02");

      // Layer one on top — HUD, streamed chunks, persistent managers.
      SceneManager.LoadScene("PauseMenu", LoadSceneMode.Additive);
      SceneManager.UnloadSceneAsync("PauseMenu");

      // Async, with progress.
      var op = SceneManager.LoadSceneAsync("Level02");
      while (!op.isDone) { _bar.value = op.progress; await Awaitable.NextFrameAsync(); }
    notes: >-
      Scenes are listed in Build Settings and referenced by name or index.
      Additive is a distinct mode with its own unload call.
  - engine: godot
    symbol: SceneTree.change_scene_to_file
    signature: 'func change_scene_to_file(path: String) -> Error'
    docsUrl: https://docs.godotengine.org/en/4.4/classes/class_scenetree.html#class-scenetree-method-change-scene-to-file
    snippet: |
      # Replace the current scene. Deferred to the end of the frame.
      get_tree().change_scene_to_file("res://levels/level_02.tscn")

      # "Additive" is just instantiation — no special API.
      var menu := preload("res://ui/pause_menu.tscn").instantiate()
      add_child(menu)
      menu.queue_free()

      # Async, with progress.
      ResourceLoader.load_threaded_request(path)
      var progress := []
      ResourceLoader.load_threaded_get_status(path, progress)
    notes: >-
      Any `.tscn` can be loaded as the root or instantiated as a child. There is
      no registry of scenes and no build list.
migration:
  fromUnity: >-
    `LoadScene` becomes `change_scene_to_file`, with a `res://` path instead of
    a registered name. Additive mode is where the model differs: Godot has no
    additive API because it does not need one — instantiating a scene and
    calling `add_child` *is* additive loading, and `queue_free()` is the unload.
    Anything that must survive a scene change goes in an **autoload** singleton
    rather than being marked `DontDestroyOnLoad`.
  fromGodot: >-
    `change_scene_to_file` becomes `LoadScene`, and every scene must be
    registered in Build Settings first. Child-scene instantiation becomes either
    a prefab or an additive load, and the two are not interchangeable the way
    they are in Godot.
related:
  - prefabs-vs-packed-scenes
  - load-resource
  - spawn-object
---

Both engines swap the running world for a different one. The difference follows
from [prefabs vs. packed scenes](/concepts/prefabs-vs-packed-scenes/): because
Godot has no scene/prefab split, it has no additive/replace split either.

## Additive loading is just a child

Unity treats "load a scene alongside the current one" as a distinct mode with
its own API and its own unload call.

In Godot, a scene is a node tree. Loading one alongside another is
`add_child()`. Unloading it is `queue_free()`. There is no special API because
there is nothing special about it — it is the same operation as spawning a
bullet, at a different scale.

This is usually a simplification. HUDs, pause menus, streamed regions and debug
overlays are all just nodes you add and remove.

## Persisting across a scene change

Unity's answer is `DontDestroyOnLoad(gameObject)`.

Godot's is an **autoload** — a scene or script registered in Project Settings
that is instantiated once at startup as a child of the root, above the current
scene. It survives every `change_scene_to_file` because it was never part of the
scene being replaced.

```gdscript
# Project Settings > Autoload, registered as "GameState"
GameState.score += 10   # available globally, no lookup
```

Autoloads are declared centrally rather than created by whichever object happens
to run first, which sidesteps the initialization-order problems that
`DontDestroyOnLoad` singletons tend to develop.

## The change is deferred

`change_scene_to_file` does not take effect immediately — it is queued until the
current frame finishes, so the calling node is still alive on the next line.
Code after the call still runs. Unity's `LoadScene` behaves the same way, so
this ports cleanly, but it surprises people writing it fresh.
