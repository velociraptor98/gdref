---
title: UI layout
category: ui
summary: Position and size interface elements so they hold up across resolutions. Godot leans on containers, Unity on anchors.
mappingKind: mental-model
bindings: []
migration:
  fromUnity: >-
    `RectTransform` anchors carry over almost exactly — Godot `Control` nodes
    have the same anchor and offset model, and the preset menu is the same idea
    as the anchor presets dropdown. What changes is that hand-anchoring
    everything is not idiomatic. Reach for `Container` nodes, which take control
    of their children's position and size the way a CSS flexbox does, and use
    anchors mainly for the outermost elements. `CanvasScaler` becomes the
    project-level Stretch settings, configured once rather than per canvas.
  fromGodot: >-
    Containers become LayoutGroups, which are less central to how Unity UI is
    normally built — expect to anchor more by hand. `size_flags_horizontal`
    becomes a LayoutElement's flexible width. Every UI hierarchy must sit under
    a Canvas, which has no Godot counterpart.
related:
  - components-vs-nodes
  - coordinate-systems
---

The anchoring model is nearly identical. The layout philosophy on top of it is
not, and porting a Unity UI by translating anchors one-for-one produces
something that works but fights the engine.

## Anchors are the same idea

A Godot `Control` has `anchor_left/top/right/bottom` (0–1, relative to the
parent) plus `offset_*` values in pixels. A `RectTransform` has anchorMin,
anchorMax and offsets. Same model, same behaviour when the parent resizes, same
preset shortcuts in the toolbar.

Anything you know about anchoring for resolution-independence transfers
directly.

## But containers are the idiomatic tool

Unity's LayoutGroups exist but are optional, and plenty of production UI anchors
every element by hand.

In Godot, `Container` nodes are the default approach. A container *owns* its
children's position and size — you cannot move a child of a `VBoxContainer` by
hand, because the container overwrites it every layout pass.

| Container | Does |
| --- | --- |
| `VBoxContainer` / `HBoxContainer` | stacks children in a column or row |
| `GridContainer` | fixed-column grid |
| `MarginContainer` | adds padding around one child |
| `CenterContainer` | centres its child |
| `PanelContainer` | draws a background, sizes to its child |
| `AspectRatioContainer` | constrains a child's aspect |

Nest them and most layouts need no manual anchoring at all. `size_flags_horizontal`
and `size_flags_vertical` control how a child behaves inside its container —
`SIZE_EXPAND_FILL` is flexbox's `flex-grow: 1`, and `stretch_ratio` is the
relative weight.

If you find yourself setting positions on UI elements in Godot, you are usually
one container away from not needing to.

## There is no Canvas

Unity requires every UI element under a `Canvas`, which decides render mode
(overlay, camera, world space) and carries the `CanvasScaler`.

Godot has no equivalent. `Control` nodes draw wherever they sit in the tree.
The pieces map like this:

- **Screen Space Overlay** — a `CanvasLayer` node, which also gives you draw
  ordering independent of the scene.
- **World Space** — a `SubViewport` rendered onto a 3D surface.
- **CanvasScaler** — Project Settings > Display > Window > Stretch, set once for
  the whole project rather than per canvas.

The stretch settings are worth configuring before building any UI: `canvas_items`
mode with an `expand` aspect is the usual starting point, and it is the setting
that makes a UI resolution-independent.

## Control vs. Node2D

Both position things in 2D, and mixing them up is a common early mistake.
`Control` participates in the layout system — it has a size, anchors, focus
handling and theme support. `Node2D` has a position and nothing else.

UI goes under `Control`. Game objects go under `Node2D`. A sprite parented to a
`VBoxContainer` will not be laid out, because containers only arrange `Control`
children.

## Theming replaces prefab-per-widget

Unity styling is usually per-component, with prefabs for consistency. Godot has
a `Theme` resource defining fonts, colours, and styleboxes per control type,
assigned once near the root and inherited down the tree. Closer to a stylesheet
than to a prefab library, and worth setting up early rather than restyling
controls individually.
