---
title: Lighting
category: rendering
summary: Light types, shadows, and global illumination in 2D and 3D.
mappingKind: approximate
bindings:
  - engine: unity
    symbol: UnityEngine.Light
    signature: 'class Light : Behaviour'
    docsUrl: https://docs.unity3d.com/ScriptReference/Light.html
    snippet: |
      [SerializeField] private Light _torch;

      void Flicker()
      {
          _torch.intensity = Random.Range(0.8f, 1.2f);
          _torch.color = Color.Lerp(Color.red, Color.yellow, 0.5f);
      }

      // Types: Directional, Point, Spot, Area.
      // Baking via Lightmapping; realtime GI via APV in URP/HDRP.
    notes: >-
      One `Light` component with a `type` field. Render pipeline choice (Built-in,
      URP, HDRP) heavily determines what is available.
  - engine: godot
    symbol: DirectionalLight3D
    signature: 'class DirectionalLight3D : Light3D'
    docsUrl: https://docs.godotengine.org/en/4.4/classes/class_directionallight3d.html
    snippet: |
      # Separate node types rather than one component with a mode.
      $Sun.light_energy = 1.2
      $Torch.light_color = Color.ORANGE
      $Torch.omni_range = 8.0

      # 2D lighting is a first-class, separate system.
      $PointLight2D.texture = preload("res://fx/light_cookie.png")
    notes: >-
      `DirectionalLight3D`, `OmniLight3D`, `SpotLight3D` in 3D;
      `DirectionalLight2D` and `PointLight2D` in 2D. No area light.
migration:
  fromUnity: >-
    The `type` field becomes the node type — Point becomes `OmniLight3D`, Spot
    becomes `SpotLight3D`, Directional keeps its name. `intensity` becomes
    `light_energy`, though the units differ so values need retuning rather than
    copying. Baked lightmaps become `LightmapGI`, and realtime GI becomes
    `VoxelGI` or `SDFGI`. The big addition is that **2D lighting is a real
    system** in Godot — `PointLight2D` with normal maps on sprites, rather than
    Unity's 2D lights being a URP-specific feature.
  fromGodot: >-
    Node types collapse into one Light component plus a type. Expect to pick a
    render pipeline first, since that determines which features exist at all —
    Godot has no equivalent decision.
related:
  - materials-and-shaders
  - cameras
---

Broadly similar feature sets, organised differently, with one structural
simplification and one genuine gap.

## No render pipeline decision

Unity's biggest lighting question is usually "which pipeline" — Built-in, URP or
HDRP — because it determines which light types, shadow modes and GI systems
exist.

Godot has one renderer with three quality tiers (Forward+, Mobile, Compatibility)
selected per project and switchable later. Features degrade across tiers, but the
node types and their properties stay the same, so scenes do not need rebuilding.

## Light types

| Unity | Godot 3D |
| --- | --- |
| Directional | `DirectionalLight3D` |
| Point | `OmniLight3D` |
| Spot | `SpotLight3D` |
| Area (baked only) | *no equivalent* |

Area lights are the gap. The usual substitutes are an emissive material
contributing through GI, or several omni lights approximating the shape.

## Intensity does not port numerically

`light_energy` defaults to 1.0 and is not in the same units as Unity's
`intensity`, which itself changes meaning between pipelines and between the
physical and non-physical light unit modes. Treat lighting values as something to
re-tune by eye, not to convert.

Godot also has `light_indirect_energy` and `light_volumetric_fog_energy` as
separate multipliers, which is finer-grained than Unity's bounce intensity.

## Global illumination

| Need | Godot |
| --- | --- |
| Baked, static, cheapest | `LightmapGI` |
| Realtime, dynamic, moderate cost | `VoxelGI` |
| Realtime, large open scenes | `SDFGI` (a `WorldEnvironment` setting) |
| Screen-space, cheap detail | SSIL / SSAO in `WorldEnvironment` |

`SDFGI` has no direct Unity counterpart and is the usual answer for open
environments: no baking step, no probe placement, works with fully dynamic
geometry.

Most of what Unity puts on the Lighting window lives on a `WorldEnvironment`
node in Godot — sky, ambient light, fog, tonemapping, glow and SSAO are all
`Environment` resource properties. Only one `WorldEnvironment` should exist per
scene.

## 2D lighting is properly supported

In Unity, 2D lights arrive via URP's 2D renderer and are pipeline-specific. In
Godot, `PointLight2D` and `DirectionalLight2D` are core nodes that work
everywhere.

`PointLight2D` takes a texture as its falloff shape, so a light "cookie" is the
normal way to author a torch or a cone. Combined with normal maps on sprites
(`CanvasTexture`), 2D scenes get real directional shading. `LightOccluder2D`
casts 2D shadows.

This is one of the areas where Godot is ahead for 2D work specifically.
