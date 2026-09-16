# Scope policy

This file is the contract. When a judgment call comes up during authoring,
it gets settled here first, then in content.

## Engines

| Engine | Line tracked | Docs license | Content we ship |
| --- | --- | --- | --- |
| Godot | 4.x (version-keyed) | CC-BY 3.0 — mirrorable with attribution | Full text, full symbol pages |
| Unity  | Unity 6 (pinned)    | Proprietary, no redistribution        | Symbol metadata + our prose + outbound link |

Godot is version-keyed because 4.x signatures move between minors.
Unity is pinned to one line, so the `version` field carries a single value and
there is no version-switcher UI. The field stays in the schema so the next
Unity major is new rows, not a migration.

## Unity: modern only

**In scope**
- Input System package (`InputAction`, `PlayerInput`, Input Action Assets)
- `Awaitable` and async/await
- `[SerializeField]` and the serialization system
- URP as the assumed render pipeline
- TextMeshPro, assembly definitions, Package Manager
- uGUI **and** UI Toolkit — see judgment call below

**Out of scope**
- `Input.GetKey` / `GetAxis` / `GetButton` (old Input Manager)
- `OnGUI` / IMGUI at runtime
- Built-in Render Pipeline
- UNet / `UnityEngine.Networking`
- Coroutines as the *primary* async idiom

### Judgment calls

**uGUI stays in scope.** UI Toolkit is the direction of travel, but a large
share of real in-game UI is still uGUI. Declaring it legacy would make us
wrong in a way users notice immediately.

**DOTS / Entities is out.** It is a parallel paradigm, not the modern version
of MonoBehaviour, and Godot has no counterpart. Every row would be an empty
cell.

## Legacy symbols are indexed, never featured

Our target reader is a Unity developer with an existing project open. They
will search `Input.GetAxis`, because that is what is on their screen. Legacy
Unity symbols therefore exist in the index as **redirect stubs**: searchable,
one line of content, pointing at the modern concept.

They never appear in Rosetta tables or browse pages. See `src/content/legacy/`.

## Gaps are named, never blank

Godot ships things Unity leaves to the ecosystem (`Tween` being the obvious
one). Those concepts get `mappingKind: none` and a required `gap` field naming
what the community actually reaches for.

An empty cell reads as incomplete research. A named gap reads as expertise.

## Licensing invariant

Enforced in `src/content.config.ts`, not by convention:

- `engine: godot` -> `license: full`. Prose may be rendered.
- `engine: unity` -> `license: link-only`, and `docsUrl` is **required**.

The build fails if a Unity binding claims `full`. One renderer branch, no
ambiguity, no way to leak prose we do not own during a future refactor.
