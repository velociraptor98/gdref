---
title: Clamp the camera to level bounds
group: camera
order: 20
summary: Stop the camera showing the void outside the level.
related: [cameras]
---

Set `limit_left/top/right/bottom` on the `Camera2D` in the inspector, or derive
them from the level's tilemap at runtime:

```gdscript
extends Camera2D

func fit_to(tilemap: TileMapLayer) -> void:
    var rect := tilemap.get_used_rect()
    var cell := tilemap.tile_set.tile_size
    limit_left = rect.position.x * cell.x
    limit_top = rect.position.y * cell.y
    limit_right = rect.end.x * cell.x
    limit_bottom = rect.end.y * cell.y
```

Turn on `position_smoothing_enabled` for a follow camera and the limits still
hold — Godot clamps after smoothing, so it will not overshoot the edge and ease
back.
