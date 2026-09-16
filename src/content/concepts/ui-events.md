---
title: UI interaction
category: ui
summary: Buttons, focus, and reacting to a click.
mappingKind: direct
bindings:
  - engine: unity
    symbol: UnityEngine.UI.Button
    signature: 'Button.ButtonClickedEvent onClick'
    docsUrl: https://docs.unity3d.com/Packages/com.unity.ugui@latest/index.html?subfolder=/api/UnityEngine.UI.Button.html
    snippet: |
      [SerializeField] private Button _startButton;

      void OnEnable()  => _startButton.onClick.AddListener(StartGame);
      void OnDisable() => _startButton.onClick.RemoveListener(StartGame);

      // Or wire it in the Inspector via the OnClick() list.
    notes: >-
      `onClick` is a `UnityEvent`, so it is both code-subscribable and
      Inspector-wireable. Focus and navigation go through the EventSystem.
  - engine: godot
    symbol: BaseButton.pressed
    signature: 'signal pressed()'
    docsUrl: https://docs.godotengine.org/en/4.4/classes/class_basebutton.html#class-basebutton-signal-pressed
    snippet: |
      func _ready() -> void:
          $StartButton.pressed.connect(start_game)
          $StartButton.grab_focus()

      # Or connect in the editor's Node dock — stored in the scene file.
    notes: >-
      A plain signal, like everything else in Godot. `toggled(pressed)` for
      checkboxes and toggle buttons; `button_down` / `button_up` for held state.
migration:
  fromUnity: >-
    `onClick.AddListener` becomes `pressed.connect`, and the Inspector's
    OnClick() list becomes the Node dock — both store the connection in the
    scene file. The `RemoveListener` in `OnDisable` is unnecessary: Godot
    disconnects automatically when either node is freed, as covered in
    [cleanup](/concepts/exit-lifecycle/). Note that `pressed` is both a signal
    and a property name on `BaseButton`, so `button.pressed.connect(...)`
    connects while `button.button_pressed` reads toggle state.
  fromGodot: >-
    `pressed.connect` becomes `onClick.AddListener`, and you take on removing
    the listener to avoid keeping destroyed objects alive.
related:
  - ui-layout
  - events-and-signals
  - input-event-propagation
---

Both engines route button clicks through their general event mechanism, so this
mostly follows from [events and signals](/concepts/events-and-signals/).

## The signal set

| Signal | Fires |
| --- | --- |
| `pressed` | a complete click or activation |
| `button_down` / `button_up` | on press and release separately |
| `toggled(toggled_on)` | when `toggle_mode` is on |

`BaseButton` is the shared base, so `Button`, `TextureButton`, `CheckBox`,
`CheckButton` and `OptionButton` all carry the same signals. Unity needs
different components with different event types for the same range.

## The pressed naming collision

Worth flagging because the error is confusing:

```gdscript
$Button.pressed.connect(_on_pressed)   # the SIGNAL
$Button.button_pressed                 # the toggle-state PROPERTY
```

In Godot 3 the property was `pressed`, and older tutorials still use it. In
Godot 4 the property was renamed to `button_pressed` so the signal could take
the name.

## Focus and gamepad navigation

Godot handles focus on `Control` nodes directly, with no EventSystem equivalent:

```gdscript
$StartButton.grab_focus()
$StartButton.focus_neighbor_bottom = $QuitButton.get_path()
```

By default, focus moves with the `ui_up` / `ui_down` / `ui_left` / `ui_right`
actions, which exist in every project's [input map](/concepts/input-actions/)
out of the box. A keyboard- and gamepad-navigable menu usually needs no setup
beyond ordering the nodes sensibly; `focus_neighbor_*` overrides the automatic
choice when the geometry confuses it.

`focus_mode` controls whether a Control can be focused at all — the usual fix
when a custom control refuses to take keyboard input.

## Custom controls

Subclass `Control` and override `_gui_input` to handle events, `_draw` to render.
Because the control participates in the same
[propagation pipeline](/concepts/input-event-propagation/), calling
`accept_event()` stops the click reaching the game underneath — the behaviour
that needs `IsPointerOverGameObject` in Unity.
