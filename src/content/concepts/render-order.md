---
title: Draw order and layers
category: rendering
summary: Deciding what draws in front of what, especially in 2D.
mappingKind: approximate
bindings:
  - engine: unity
    symbol: UnityEngine.Renderer
    signature: 'int sortingOrder'
    docsUrl: https://docs.unity3d.com/ScriptReference/Renderer-sortingOrder.html
    snippet: |
      _renderer.sortingLayerName = "Foreground";
      _renderer.sortingOrder = 10;          // within the layer

      // UI draws by hierarchy order within a Canvas;
      // Canvases sort by sortingOrder.
    notes: >-
      Sorting layers are a named, ordered list in Project Settings, with
      `sortingOrder` breaking ties inside one.
  - engine: godot
    symbol: CanvasItem.z_index
    signature: 'var z_index: int'
    docsUrl: https://docs.godotengine.org/en/4.4/classes/class_canvasitem.html#class-canvasitem-property-z-index
    snippet: |
      $Player.z_index = 10          # -4096..4096, higher draws in front
      $Player.z_as_relative = true  # relative to parent (the default)

      # Independent of the world: HUD, transitions, pause overlays.
      # A CanvasLayer's `layer` dominates any z_index beneath it.
    notes: >-
      Three stacked rules: `CanvasLayer`, then `z_index`, then tree order.
      Tree order is the base case — later siblings draw on top.
migration:
  fromUnity: >-
    Sorting layers become `z_index`, an integer rather than a named list — many
    projects keep the names as constants. The behaviour that has no Unity
    counterpart is that **tree order is the tiebreak**: with equal `z_index`,
    later siblings draw in front, so reordering nodes in the scene dock changes
    draw order. Canvas sorting becomes `CanvasLayer`, which is also what
    replaces a screen-space Canvas.
  fromGodot: >-
    `z_index` becomes a sorting layer plus `sortingOrder`. Tree order stops
    mattering, so anything relying on sibling order needs explicit numbers.
related:
  - ui-layout
  - cameras
  - materials-and-shaders
---

2D draw order is a common early frustration in both engines, usually because the
rules are layered and only some of them are visible in the inspector.

## Godot's three rules, in priority order

1. **`CanvasLayer`** — a node establishing a whole separate drawing layer with
   its own transform. Anything inside a layer with a higher `layer` value draws
   over everything in lower ones, regardless of `z_index`. This is how HUDs,
   pause overlays and screen transitions sit above the world.
2. **`z_index`** — a per-`CanvasItem` integer, −4096 to 4096. Higher is in
   front. With `z_as_relative` (the default), a child's value is added to its
   parent's.
3. **Tree order** — with everything else equal, later siblings draw on top.

Rule 3 is the one that surprises people, and it is also the most useful: for
sprites within one object, ordering the nodes in the scene dock *is* the draw
order. No numbers needed.

## z_as_relative is worth understanding

Default `true` means a child's `z_index` is relative to its parent's. A character
with `z_index = 10` and a weapon child at `z_index = 1` puts the weapon at
effective 11 — so the whole character moves as a unit and internal ordering is
preserved.

Setting `z_as_relative = false` makes the value absolute, pulling the node out of
its parent's ordering entirely. Useful for something that must always draw on
top, and a source of confusion when set accidentally.

## Y-sorting

For top-down games where objects nearer the bottom of the screen should draw in
front, Godot has it built in: set `y_sort_enabled` on the parent node, and its
children sort by their Y position automatically.

Unity has no built-in equivalent — the usual approach is a script writing
`sortingOrder` from `transform.position.y` every frame. This is a small but real
win for 2D projects.

## 3D transparency

In 3D, both engines sort transparent objects by distance and both hit the same
classic artefacts with intersecting transparent surfaces. Godot's per-material
`render_priority` is the counterpart to Unity's render queue, and
`StandardMaterial3D` exposes a depth-draw mode for the cases where sorting alone
is not enough.
