---
title: Global state and singletons
category: scripting
summary: One object reachable from anywhere — a game state manager, an audio director, a save system.
mappingKind: approximate
bindings:
  - engine: unity
    symbol: UnityEngine.Object.DontDestroyOnLoad
    signature: 'static void DontDestroyOnLoad(Object target)'
    docsUrl: https://docs.unity3d.com/ScriptReference/Object.DontDestroyOnLoad.html
    snippet: |
      public class GameState : MonoBehaviour
      {
          public static GameState Instance { get; private set; }
          public int Score;

          void Awake()
          {
              if (Instance != null) { Destroy(gameObject); return; }
              Instance = this;
              DontDestroyOnLoad(gameObject);
          }
      }

      // Used as: GameState.Instance.Score += 10;
    notes: >-
      Hand-rolled: a static field, a duplicate guard, and a survival flag.
      Creation order depends on which scene happens to load first.
  - engine: godot
    symbol: ProjectSettings
    signature: 'Project Settings > Globals > Autoload'
    docsUrl: https://docs.godotengine.org/en/4.4/tutorials/scripting/singletons_autoload.html
    snippet: |
      # game_state.gd — registered as "GameState" in Project Settings.
      extends Node

      var score: int = 0

      func add_score(n: int) -> void:
          score += n
          score_changed.emit(score)

      signal score_changed(value: int)

      # Used from anywhere, no lookup and no import:
      #   GameState.add_score(10)
    notes: >-
      Registered in Project Settings, instantiated once at startup as a child of
      the root, above the current scene. The registered name becomes a global
      identifier.
migration:
  fromUnity: >-
    The entire singleton boilerplate disappears. No static Instance property, no
    duplicate guard, no `DontDestroyOnLoad` — register the script as an autoload
    and its name is a global. Order is explicit too: autoloads initialise in the
    order they are listed in Project Settings, before the main scene, which
    removes the initialisation-order races that Unity singletons develop.
  fromGodot: >-
    Autoloads become the static-Instance pattern, and you take on the
    boilerplate: a static field, a guard against duplicates, `DontDestroyOnLoad`,
    and a decision about who creates it first. A bootstrap scene that loads
    before everything else is the usual way to make the order deterministic.
related:
  - scene-loading
  - gdscript-vs-csharp
  - events-and-signals
---

Every project needs a few objects that outlive the current scene. Unity leaves
you to build that; Godot has it as a project setting.

## What autoload actually does

Registering `res://game_state.gd` as `GameState` makes Godot, at startup:

1. Instantiate the script (or scene) once.
2. Add it as a child of the tree root — a *sibling* of the current scene, not
   part of it.
3. Bind the name `GameState` as a global identifier in every script.

Because it is not inside the current scene, `change_scene_to_file` never touches
it. Survival is structural rather than a flag.

## Order is declared, not discovered

The Unity singleton's weak point is initialisation order: whichever object's
`Awake` runs first wins, and that depends on scene contents and load order. It
works until you add a second scene that needs the singleton during its own
`Awake`.

Autoloads initialise top to bottom in the order listed in Project Settings, and
all of them finish before the main scene's `_ready`. If `SaveSystem` must exist
before `GameState`, list it first. That is the whole mechanism.

## An autoload can be a scene

The registration accepts a `.tscn` as readily as a `.gd`. That makes it the
standard answer for global UI — a transition fader, a debug console, a
notification layer — which would otherwise need a `CanvasLayer` recreated in
every scene.

## The usual caution still applies

Godot makes globals cheap to create, which makes them easy to overuse. The
guidance is the same as in Unity: globals for genuinely global concerns, and
[signals](/concepts/events-and-signals/) for everything else. An autoload
holding a signal bus that other nodes connect to is a common middle ground —
global reachability without global mutable state.
