---
title: Text and fonts
category: ui
summary: Displaying text, styling it, and handling rich or localised content.
mappingKind: approximate
bindings:
  - engine: unity
    symbol: TMPro.TextMeshProUGUI
    signature: 'string text'
    docsUrl: https://docs.unity3d.com/Packages/com.unity.textmeshpro@latest/index.html?subfolder=/manual/index.html
    snippet: |
      [SerializeField] private TextMeshProUGUI _score;

      void Update() => _score.text = $"Score: {_value}";

      // Rich text uses TMP's own tag set.
      _label.text = "<color=#ff0000><b>Critical!</b></color>";
    notes: >-
      TextMeshPro requires generating a font atlas asset per font and size
      range. Rich text tags are TMP-specific, not HTML.
  - engine: godot
    symbol: Label
    signature: 'var text: String'
    docsUrl: https://docs.godotengine.org/en/4.4/classes/class_label.html
    snippet: |
      func _process(_delta: float) -> void:
          $Score.text = "Score: %d" % value

      # RichTextLabel for markup, with BBCode.
      $Dialogue.bbcode_enabled = true
      $Dialogue.text = "[color=red][b]Critical![/b][/color]"
    notes: >-
      `Label` for plain text, `RichTextLabel` for markup. Fonts are used
      directly — no atlas generation step.
migration:
  fromUnity: >-
    `TextMeshProUGUI` splits by need: `Label` for plain text, `RichTextLabel`
    when you want markup. The font atlas workflow disappears entirely — drop a
    `.ttf` or `.otf` in the project and use it, at any size, with no
    pre-generation and no missing-glyph rebuilds. Rich text tags convert from
    TMP syntax to BBCode, which is similar in spirit (`<b>` becomes `[b]`) but
    not identical, so text content with markup needs a pass.
  fromGodot: >-
    Both label types become TextMeshPro, and you gain the atlas generation step.
    Budget for it when adding languages — a CJK font atlas is a real
    configuration task.
related:
  - ui-layout
  - ui-events
---

Godot's text handling needs less setup than TextMeshPro, mainly because it does
not pre-generate atlases.

## Two nodes

- **`Label`** — plain text, fast, wrapping and alignment, no markup. The default
  choice.
- **`RichTextLabel`** — BBCode markup, inline images, per-character effects,
  scrolling. Heavier; use when you need it.

Unity covers both with one component, with rich text as a toggle.

## Fonts have no build step

Drop a `.ttf`/`.otf` into the project, assign it, set a size. Godot rasterises at
runtime with dynamic caching, so:

- Any size works without regenerating anything.
- Adding a language does not require rebuilding an atlas.
- Missing glyphs are a font coverage question, not an atlas configuration one.

`FontVariation` handles weight, spacing and outlines on top of a base font.
`LabelSettings` bundles font, size, colour and outline as a shareable
[resource](/concepts/scriptable-objects/) — the tidy alternative to restyling
each label.

For project-wide typography, set the font once in a `Theme` and let it inherit,
as covered in [UI layout](/concepts/ui-layout/).

## Markup differs

| TextMeshPro | Godot BBCode |
| --- | --- |
| `<b>`, `<i>`, `<u>` | `[b]`, `[i]`, `[u]` |
| `<color=#ff0000>` | `[color=red]` or `[color=#ff0000]` |
| `<size=30>` | `[font_size=30]` |
| `<sprite=0>` | `[img]res://icon.png[/img]` |
| `<link="id">` | `[url=id]` + the `meta_clicked` signal |

Remember `bbcode_enabled = true`, or tags render as literal text — the most
common `RichTextLabel` question.

`RichTextLabel` also supports custom effects: subclass `RichTextEffect`, register
it, and use `[shake]`, `[wave]`, `[tornado]` or your own tag. Per-character
animation for dialogue is a few lines rather than a TMP animation script.

## Formatting numbers

GDScript uses `%`-style formatting rather than interpolation:

```gdscript
"Score: %d" % value
"%.2f seconds" % elapsed
"%s took %d damage" % [name, amount]
```

There is also `String.format()` with named placeholders. No `$"..."`
interpolation equivalent — see
[GDScript vs. C#](/concepts/gdscript-vs-csharp/).

## Localisation

Godot has translation built in: import a CSV of translations, and `tr("KEY")`
resolves against the current locale. Control nodes with `auto_translate` call it
automatically, so a `Label` whose text is a key localises with no code.

Unity's equivalent is the separate Localization package.
