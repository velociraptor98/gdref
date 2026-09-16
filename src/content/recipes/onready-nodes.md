---
title: Reference child nodes safely
group: scene
order: 20
summary: Get typed references to children without null errors.
related: [find-nodes, initialization]
---

```gdscript
# Resolved just before _ready — the node is in the tree by then.
@onready var sprite: Sprite2D = $Sprite2D
@onready var anim: AnimationPlayer = $AnimationPlayer

# Scene-unique name: survives being moved in the hierarchy.
@onready var health_bar: ProgressBar = %HealthBar

# Optional child — no error if it is absent.
@onready var optional := get_node_or_null("Shield") as Node2D
```

Without `@onready`, `var sprite := $Sprite2D` runs during construction, before
the node enters the tree, and gives you null.

Mark a node unique with right-click > **Access as Unique Name** to use `%`.
