---
title: Pathfinding and navigation
category: navigation
summary: Getting an agent from A to B around obstacles.
mappingKind: approximate
bindings:
  - engine: unity
    symbol: UnityEngine.AI.NavMeshAgent
    signature: 'bool SetDestination(Vector3 target)'
    docsUrl: https://docs.unity3d.com/ScriptReference/AI.NavMeshAgent.html
    snippet: |
      [SerializeField] private NavMeshAgent _agent;

      void Chase(Transform target)
      {
          _agent.SetDestination(target.position);
          // The agent moves itself — it owns the transform.
      }
    notes: >-
      The agent drives movement directly. Bake a NavMesh from static geometry;
      `NavMeshObstacle` carves holes at runtime.
  - engine: godot
    symbol: NavigationAgent2D
    signature: 'var target_position: Vector2'
    docsUrl: https://docs.godotengine.org/en/4.4/classes/class_navigationagent2d.html
    snippet: |
      @onready var agent: NavigationAgent2D = $NavigationAgent2D

      func _physics_process(_delta: float) -> void:
          agent.target_position = target.global_position
          if agent.is_navigation_finished():
              return
          # The agent advises; YOU move the body.
          var next := agent.get_next_path_position()
          velocity = global_position.direction_to(next) * speed
          move_and_slide()
    notes: >-
      The agent computes the path and reports the next waypoint. It does not
      move anything — you apply the movement yourself.
migration:
  fromUnity: >-
    The control inversion is the whole story. `NavMeshAgent` owns and moves the
    transform; `NavigationAgent2D/3D` is an advisor that hands you the next
    waypoint and expects you to drive the body. That is more code, but it means
    pathfinding composes with your existing
    [character movement](/concepts/character-movement/) rather than competing
    with it — no more fighting the agent for control of the transform.
    `SetDestination` becomes the `target_position` property, and baking a
    NavMesh becomes a `NavigationRegion2D/3D` with a baked polygon.
  fromGodot: >-
    `NavMeshAgent` takes over movement, so the manual `move_and_slide()` step
    goes away — along with your control over it. Expect to work around the agent
    when you need custom movement behaviour.
related:
  - character-movement
  - physics-step
---

Both engines bake walkable geometry, run A* over it, and expose an agent that
handles avoidance. The difference is who moves the character.

## The agent advises; you move

Unity's `NavMeshAgent` is a controller: set a destination and it drives the
transform, applying its own speed, acceleration and rotation.

Godot's `NavigationAgent` is a query object. It knows the path and the next
waypoint; it never touches your node. The loop is always:

```gdscript
agent.target_position = destination
var next := agent.get_next_path_position()
velocity = global_position.direction_to(next) * speed
move_and_slide()
```

More lines, and better separation. The agent does not fight your controller,
gravity still works, and the same movement code handles both player and AI. The
classic Unity problem of a NavMeshAgent overriding a custom controller has no
Godot equivalent.

## Baking

| Unity | Godot |
| --- | --- |
| Navigation window, bake per scene | `NavigationRegion2D/3D` node, bake its polygon/mesh |
| `NavMeshObstacle` | `NavigationObstacle2D/3D` |
| Off-Mesh Link | `NavigationLink2D/3D` |
| NavMesh Areas + costs | navigation layers + `travel_cost` / `enter_cost` |

Godot's regions are nodes, so a level built from several
[scenes](/concepts/scene-loading/) can carry its own navigation with it, and
regions can be added or removed at runtime. Unity's bake is per-scene.

For 2D, `NavigationRegion2D` takes a `NavigationPolygon` you can draw by hand or
bake from collision geometry — no tilemap-specific pathfinding needed, though
`TileMapLayer` can contribute navigation polygons per tile.

## Avoidance

Set `avoidance_enabled = true` and agents negotiate with each other via RVO.
That path is slightly different: instead of reading `get_next_path_position()`
directly, you feed a desired velocity in and receive a safe one back through the
`velocity_computed` signal.

```gdscript
agent.velocity_computed.connect(_on_safe_velocity)
agent.velocity = desired_velocity     # triggers computation

func _on_safe_velocity(safe: Vector2) -> void:
    velocity = safe
    move_and_slide()
```

Skip avoidance unless you need it — the direct waypoint path is simpler and
sufficient for most cases.

## Plain A* without navmeshes

For grid or graph movement, Godot ships `AStarGrid2D` and `AStar2D/3D` as
standalone classes with no nodes or baking involved. For tile-based games these
are usually a better fit than the navigation system, and Unity has no built-in
counterpart.
