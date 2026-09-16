---
title: Input events and propagation
category: input
summary: Handling raw events rather than polling, and stopping UI clicks from reaching the game.
mappingKind: approximate
bindings:
  - engine: unity
    symbol: UnityEngine.EventSystems.IPointerClickHandler
    signature: 'void OnPointerClick(PointerEventData eventData)'
    docsUrl: https://docs.unity3d.com/Packages/com.unity.ugui@latest/index.html?subfolder=/manual/SupportedEvents.html
    snippet: |
      // UI events arrive through the EventSystem, by interface.
      public class Slot : MonoBehaviour, IPointerClickHandler
      {
          public void OnPointerClick(PointerEventData e) { Select(); }
      }

      // Game code must ask whether the UI already took the click.
      void Update()
      {
          if (EventSystem.current.IsPointerOverGameObject()) return;
          if (_fire.action.WasPressedThisFrame()) Shoot();
      }
    notes: >-
      Two separate systems: the EventSystem for UI, action polling for gameplay.
      Keeping them from fighting is manual.
  - engine: godot
    symbol: Node._unhandled_input
    signature: 'func _unhandled_input(event: InputEvent) -> void'
    docsUrl: https://docs.godotengine.org/en/4.4/classes/class_node.html#class-node-private-method-unhandled-input
    snippet: |
      # UI first. Controls consume what they use.
      func _gui_input(event: InputEvent) -> void:
          if event is InputEventMouseButton and event.pressed:
              select()
              accept_event()          # stop here

      # Gameplay sees only what the UI did not take.
      func _unhandled_input(event: InputEvent) -> void:
          if event.is_action_pressed("fire"):
              shoot()
              get_viewport().set_input_as_handled()
    notes: >-
      One pipeline with defined stages. A Control that handles an event marks it
      handled, and `_unhandled_input` never sees it.
migration:
  fromUnity: >-
    The `IsPointerOverGameObject()` guard disappears. Godot runs a single input
    pipeline in which UI gets first refusal, so putting gameplay input in
    `_unhandled_input` means clicks on buttons never reach the game — no checks
    required. Interface-based UI handlers become either built-in Control signals
    (`pressed`, `gui_input`) or an overridden `_gui_input`.
  fromGodot: >-
    The single pipeline splits in two. Gameplay input polls actions; UI goes
    through the EventSystem. You are responsible for the guard that stops a
    click doing both.
related:
  - input-button-state
  - input-actions
  - ui-events
---

Polling (`Input.is_action_pressed` in `_process`) covers most gameplay. This
page is about the other mode: reacting to discrete events, and deciding who gets
to consume them.

## Godot's pipeline has stages

Every event walks the same path, stopping as soon as something handles it:

1. **`_input`** — every node with input processing, before anything else.
   Use sparingly; it sees everything.
2. **`Control._gui_input`** — UI nodes under the pointer, top-most first.
   `accept_event()` stops propagation here.
3. **`_unhandled_input`** — only events no Control consumed.
4. **`_unhandled_key_input`** — keyboard-specific, after the above.

**Put gameplay input in `_unhandled_input`.** That one habit makes the
click-through problem disappear: a button press is consumed at stage 2 and never
arrives at stage 3.

This is the direct answer to `EventSystem.current.IsPointerOverGameObject()`,
which exists in Unity precisely because its two input paths are independent.

## Consuming events

| Where | How to stop propagation |
| --- | --- |
| `_gui_input` on a Control | `accept_event()` |
| `_input` / `_unhandled_input` | `get_viewport().set_input_as_handled()` |

Consuming matters for modality. A dialog that consumes input in `_gui_input`
blocks the game underneath without any "is a dialog open" flag.

## Event types

Events arrive as `InputEvent` subclasses, and the idiomatic test is `is`:

```gdscript
func _unhandled_input(event: InputEvent) -> void:
    if event is InputEventMouseButton and event.button_index == MOUSE_BUTTON_LEFT:
        ...
    elif event is InputEventKey and event.keycode == KEY_ESCAPE:
        ...
```

Prefer `event.is_action_pressed("fire")` over raw key checks — it respects the
[input map](/concepts/input-actions/) and stays rebindable. Raw keycodes are for
debug shortcuts and text entry.

## Polling vs. events

The same guidance holds in both engines:

- **Continuous** — movement, aiming, holding a trigger — poll in
  `_process`/`_physics_process`.
- **Discrete** — menu navigation, a jump press, a dialog advance — handle the
  event.

Events cannot be missed, whereas polling can drop a press that starts and ends
within one frame. That matters most on the physics step, where the frame
boundary does not line up — see
[button state](/concepts/input-button-state/).
