---
title: Materials and shaders
category: rendering
summary: Surface appearance — assigning materials, setting parameters, writing custom shaders.
mappingKind: mental-model
bindings:
  - engine: unity
    symbol: UnityEngine.Material
    signature: 'void SetFloat(string name, float value)'
    docsUrl: https://docs.unity3d.com/ScriptReference/Material.html
    snippet: |
      // Instance the material to avoid editing the shared asset.
      var mat = _renderer.material;        // shared asset if you use .sharedMaterial
      mat.SetFloat("_Dissolve", 0.5f);
      mat.SetColor("_BaseColor", Color.red);

      // Shader Graph, or HLSL in a .shader file.
    notes: >-
      `.material` silently instantiates a copy; `.sharedMaterial` edits the
      asset for every user. Custom shaders are HLSL wrapped in ShaderLab, or
      Shader Graph nodes.
  - engine: godot
    symbol: ShaderMaterial
    signature: 'func set_shader_parameter(param: StringName, value: Variant) -> void'
    docsUrl: https://docs.godotengine.org/en/4.4/classes/class_shadermaterial.html
    snippet: |
      # Materials are Resources — shared unless you duplicate.
      var mat: ShaderMaterial = $Sprite2D.material
      mat.set_shader_parameter("dissolve", 0.5)

      # Per-instance copy:
      $Sprite2D.material = mat.duplicate()
    notes: >-
      Shaders use the Godot Shading Language, close to GLSL. There is a visual
      shader editor (`VisualShader`) as well.
migration:
  fromUnity: >-
    The asset model matches: materials are shared resources, and you duplicate
    for per-instance variation. The trap inverts, though — Unity's `.material`
    copies automatically while `.sharedMaterial` does not, whereas Godot always
    gives you the shared resource and you must call `.duplicate()` yourself.
    Code ported literally will edit every user of the material. Shader code does
    not port: HLSL/ShaderLab becomes the Godot Shading Language, and Shader
    Graph becomes VisualShader, neither of which has a converter.
  fromGodot: >-
    `set_shader_parameter` becomes `SetFloat`/`SetColor`/`SetVector` — typed
    setters rather than one Variant-taking call. Remember `.sharedMaterial` when
    you actually want to edit the asset.
related:
  - scriptable-objects
  - render-order
  - particles
---

The asset plumbing is similar enough to port mechanically. The shader language
is a rewrite, and that is the part to plan for.

## The sharing trap runs the other way

Unity:

```csharp
_renderer.material.SetFloat(...)        // silently copies — per-instance
_renderer.sharedMaterial.SetFloat(...)  // edits the asset — all users
```

Godot:

```gdscript
$Sprite2D.material.set_shader_parameter(...)             # the shared resource
$Sprite2D.material = $Sprite2D.material.duplicate()      # now per-instance
```

Godot never copies behind your back. A flash-on-hit effect ported directly from
Unity's `.material` idiom will flash every enemy at once.

For the common case of per-instance values without duplicating the material,
Godot has a cheaper tool: `set_instance_shader_parameter()`, which sets a
parameter declared `instance uniform` without breaking batching.

## The shading language

Godot's shading language is GLSL-like, with engine-specific structure. A minimal
2D shader:

```glsl
shader_type canvas_item;

uniform float dissolve : hint_range(0.0, 1.0) = 0.0;
uniform vec4 tint : source_color = vec4(1.0);

void fragment() {
    vec4 tex = texture(TEXTURE, UV);
    if (tex.a < dissolve) discard;
    COLOR = tex * tint;
}
```

Mapping from HLSL:

| ShaderLab / HLSL | Godot |
| --- | --- |
| `Properties { _Name(...) }` | `uniform` with `hint_*` |
| `fixed4`/`half4`/`float4` | `vec4` |
| `tex2D(_Tex, uv)` | `texture(tex, uv)` |
| `frag()` returning a colour | `fragment()` writing `COLOR` |
| `v2f`/`appdata` structs | built-ins: `UV`, `VERTEX`, `NORMAL` |
| `_Time.y` | `TIME` |
| `clip(x)` | `discard` |

`shader_type` must be the first line and picks the pipeline: `canvas_item` for
2D, `spatial` for 3D, `particles`, or `sky`.

## Entry points, not a pipeline

Godot shaders override stages of the engine's own shader rather than replacing
it: `vertex()`, `fragment()`, and `light()` for custom lighting. You write only
the part you are changing, and things like shadows and fog keep working.

That is closer to a Surface Shader than to an unlit HLSL pass, and it means most
ported effects are shorter than the original.

## StandardMaterial3D before writing anything

A great deal of Unity shader work exists to add a feature to the standard
shader. `StandardMaterial3D` exposes triplanar mapping, rim lighting, proximity
and distance fade, billboarding and per-channel transforms as checkboxes.
`CanvasItemMaterial` covers 2D blend modes and lighting.

Check those before porting a shader — a fair number of ported effects turn out
to be a property.
