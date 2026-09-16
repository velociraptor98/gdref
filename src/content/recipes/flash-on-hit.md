---
title: Flash a sprite white on hit
group: effects
order: 10
summary: The classic damage feedback flash.
related: [materials-and-shaders, tweening]
---

Assign a `ShaderMaterial` to the sprite with this shader:

```glsl
shader_type canvas_item;

uniform float flash : hint_range(0.0, 1.0) = 0.0;
uniform vec4 flash_color : source_color = vec4(1.0);

void fragment() {
    vec4 tex = texture(TEXTURE, UV);
    COLOR = vec4(mix(tex.rgb, flash_color.rgb, flash), tex.a);
}
```

```gdscript
func flash() -> void:
    # Duplicate so this sprite flashes, not every user of the material.
    var mat: ShaderMaterial = sprite.material.duplicate()
    sprite.material = mat
    var tween := create_tween()
    tween.tween_method(
        func(v: float) -> void: mat.set_shader_parameter("flash", v),
        1.0, 0.0, 0.25)
```

Duplicate once in `_ready`, not on every hit. Without duplicating, every enemy
sharing the material flashes together — Godot never copies a material behind
your back the way Unity's `.material` does.

Keeping `tex.a` unchanged means transparent pixels stay transparent.
