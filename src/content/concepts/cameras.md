---
title: Cameras
category: rendering
summary: Framing the world — following a player, switching views, screen-to-world conversion.
mappingKind: approximate
bindings:
  - engine: unity
    symbol: UnityEngine.Camera
    signature: 'class Camera : Behaviour'
    docsUrl: https://docs.unity3d.com/ScriptReference/Camera.html
    snippet: |
      // A component. Camera.main finds the one tagged MainCamera.
      var cam = Camera.main;
      Vector3 world = cam.ScreenToWorldPoint(Input.mousePosition);

      // Switching views = toggling components.
      _gameplayCam.enabled = false;
      _cutsceneCam.enabled = true;
    notes: >-
      Multiple enabled cameras render together, ordered by `depth`. Follow
      behaviour is hand-written, or delegated to Cinemachine.
  - engine: godot
    symbol: Camera2D.make_current
    signature: 'func make_current() -> void'
    docsUrl: https://docs.godotengine.org/en/4.4/classes/class_camera2d.html#class-camera2d-method-make-current
    snippet: |
      # A node. Exactly one is current per viewport.
      $CutsceneCamera.make_current()

      # Following is built in — parent it to the player.
      # Camera2D also has position_smoothing_enabled, limit_* and drag margins.
      var world := get_global_mouse_position()
    notes: >-
      `Camera2D` has smoothing, screen limits and drag margins as properties,
      so a follow camera usually needs no script at all.
migration:
  fromUnity: >-
    `Camera.main` becomes `get_viewport().get_camera_2d()` or `get_camera_3d()`,
    though most code does not need the lookup — a `Camera2D` parented to the
    player follows it for free. Toggling `enabled` becomes `make_current()`,
    and the one-camera-per-viewport rule is stricter than Unity's: to render
    two views simultaneously you need a `SubViewport`, not a second camera.
    Much of what Cinemachine provides for 2D is built into `Camera2D`.
  fromGodot: >-
    `make_current()` becomes enabling one camera and disabling the others.
    Smoothing, limits and drag margins have no built-in equivalent — that is
    what Cinemachine is for.
related:
  - ui-layout
  - coordinate-systems
  - render-order
---

Same job, two structural differences: a node rather than a component, and one
current camera per viewport rather than any number rendering together.

## Camera2D does a lot for free

The standard Unity follow-camera script — lerp toward the target, clamp to level
bounds, add a dead zone — is configuration in Godot:

| Want | Property |
| --- | --- |
| Follow a target | parent the `Camera2D` to it |
| Smooth follow | `position_smoothing_enabled`, `position_smoothing_speed` |
| Clamp to level bounds | `limit_left/top/right/bottom` |
| Dead zone | `drag_horizontal_enabled`, `drag_*_margin` |
| Zoom | `zoom` (a `Vector2`; larger values zoom **out**) |
| Screen shake | `offset`, driven by a tween or noise |

For 2D this covers a large share of what Cinemachine is used for. 3D is less
generous — `Camera3D` has no built-in follow, so a spring-arm rig
(`SpringArm3D`, which handles collision) plus a short script is the norm.

## One current camera

Unity renders every enabled camera, ordered by `depth`, which is how
picture-in-picture and split-screen are built.

In Godot, a viewport has exactly one current camera. `make_current()` switches;
there is no ordering. For two simultaneous views you nest a `SubViewport` with
its own camera and display it through a `SubViewportContainer` — more setup, and
more explicit about what is being rendered where.

## Screen-to-world

```gdscript
# 2D — usually all you need
var world := get_global_mouse_position()

# 3D — project a ray from the camera
var from := camera.project_ray_origin(mouse_pos)
var to := from + camera.project_ray_normal(mouse_pos) * 1000.0
```

The 3D form pairs with [raycasting](/concepts/raycast/) for click-to-select.
Note that `project_ray_*` replaces Unity's `ScreenPointToRay`, and returns
origin and direction separately rather than a `Ray` struct.

## Pixel-perfect 2D

Godot 2D units are pixels (see
[coordinate systems](/concepts/coordinate-systems/)), so pixel-perfect rendering
is mostly project settings: a fixed viewport size, `canvas_items` stretch mode,
and `keep` or `expand` aspect. There is no per-camera orthographic size to
reconcile with a sprite's pixels-per-unit, which removes a whole category of
Unity 2D configuration.
