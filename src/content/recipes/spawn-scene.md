---
title: Spawn a scene at a position
group: scene
order: 10
summary: Instantiate a packed scene and place it in the world.
related: [spawn-object, load-resource]
---

```gdscript
const BULLET := preload("res://entities/bullet.tscn")

func fire() -> void:
    var bullet := BULLET.instantiate()
    # Configure BEFORE add_child — _ready has not run yet.
    bullet.damage = 10
    get_tree().current_scene.add_child(bullet)
    # Global transform only sticks once the node is in the tree.
    bullet.global_transform = $Muzzle.global_transform
```

Add to `current_scene` rather than `self` so bullets do not move or free with
the gun that fired them.

`preload` for a constant path (resolved at parse time, so typos fail early);
`load()` when the path is computed.
