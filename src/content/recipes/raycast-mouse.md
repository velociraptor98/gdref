---
title: Raycast to what's under the cursor
group: physics
order: 10
summary: Click-to-select, click-to-move, inspecting the world under the pointer.
related: [raycast, cameras]
---

2D:

```gdscript
func _physics_process(_delta: float) -> void:
    var space := get_world_2d().direct_space_state
    var query := PhysicsRayQueryParameters2D.create(
        global_position, get_global_mouse_position())
    query.exclude = [self]
    var hit := space.intersect_ray(query)
    if hit:
        print(hit.collider.name, " at ", hit.position)
```

3D, projecting from the camera:

```gdscript
func _physics_process(_delta: float) -> void:
    var cam := get_viewport().get_camera_3d()
    var mouse := get_viewport().get_mouse_position()
    var from := cam.project_ray_origin(mouse)
    var to := from + cam.project_ray_normal(mouse) * 1000.0

    var space := get_world_3d().direct_space_state
    var query := PhysicsRayQueryParameters3D.create(from, to)
    var hit := space.intersect_ray(query)
```

Both must run in `_physics_process` — the space state is locked elsewhere in
the frame and results are unreliable.
