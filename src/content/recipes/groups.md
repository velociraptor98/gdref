---
title: Act on every node of a kind
group: scene
order: 40
summary: Godot's answer to tags and FindObjectsByType.
related: [find-nodes]
---

```gdscript
# Join a group — in code, or via the Node dock's Groups tab.
func _ready() -> void:
    add_to_group("enemies")

# Act on all of them from anywhere.
func alert_all() -> void:
    for enemy in get_tree().get_nodes_in_group("enemies"):
        enemy.alert()

# Or without collecting the array first:
get_tree().call_group("enemies", "alert")

if body.is_in_group("player"):
    take_damage()
```

`call_group` is safe when the call might free nodes — it defers, so you are not
mutating the tree while iterating it.
