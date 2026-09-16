---
title: Multiplayer and networking
category: networking
summary: Spawning networked objects, syncing state, and calling code on another peer.
mappingKind: approximate
bindings:
  - engine: unity
    symbol: Unity.Netcode.NetworkBehaviour
    signature: '[Rpc(SendTo.Server)] void DoThingRpc()'
    docsUrl: https://docs-multiplayer.unity3d.com/netcode/current/about/
    snippet: |
      public class Player : NetworkBehaviour
      {
          // Replicated state.
          private NetworkVariable<int> _health = new(100);

          [Rpc(SendTo.Server)]
          void TakeDamageRpc(int amount)
          {
              if (!IsServer) return;
              _health.Value -= amount;
          }
      }
    notes: >-
      Netcode for GameObjects is a separate package. Scripts derive from
      `NetworkBehaviour`; objects need a `NetworkObject` and prefab registration.
  - engine: godot
    symbol: Node.rpc
    signature: 'func rpc(method: StringName, ...) -> Error'
    docsUrl: https://docs.godotengine.org/en/4.4/tutorials/networking/high_level_multiplayer.html
    snippet: |
      extends CharacterBody2D

      @rpc("any_peer", "call_local", "reliable")
      func take_damage(amount: int) -> void:
          if not multiplayer.is_server():
              return
          health -= amount

      func hit(amount: int) -> void:
          take_damage.rpc(amount)     # call it on the other peers
    notes: >-
      Built into the engine — no package. `@rpc` annotates an ordinary method;
      `MultiplayerSynchronizer` and `MultiplayerSpawner` nodes handle state
      replication and spawning declaratively.
migration:
  fromUnity: >-
    `NetworkBehaviour` has no counterpart — any node can have RPCs, so there is
    no base class to inherit and no `NetworkObject` component to attach.
    `[Rpc]` becomes the `@rpc` annotation, with the mode as arguments rather
    than a `SendTo` enum. The larger shift is that `NetworkVariable` becomes a
    `MultiplayerSynchronizer` **node** where you pick replicated properties in
    the inspector, rather than declaring them as fields — and prefab
    registration becomes a `MultiplayerSpawner` node pointing at a scene.
  fromGodot: >-
    Scripts must derive from `NetworkBehaviour` and objects need `NetworkObject`
    components plus registration in the NetworkManager. Synchronizer nodes become
    `NetworkVariable` fields declared in code.
related:
  - events-and-signals
  - spawn-object
  - singletons-autoload
---

Godot's high-level multiplayer is part of the engine rather than a package, and
it leans on nodes for the parts Unity expresses as attributes and base classes.

## Authority replaces ownership

Every node has a multiplayer authority — the peer allowed to drive it. Default
is the server (peer 1).

```gdscript
player.set_multiplayer_authority(peer_id)

if is_multiplayer_authority():
    _handle_input()      # only the owning peer runs this
```

This maps onto Unity's `IsOwner` / `IsServer` checks, with one difference worth
noting: authority is per *node*, and by default it propagates to children. So a
player scene's authority can be assigned once at the root, and a specific child
can be given different authority without restructuring anything.

## The three pieces

**`@rpc`** annotates a method as remotely callable:

```gdscript
@rpc("any_peer", "call_local", "reliable")
func take_damage(amount: int) -> void:
```

- `"any_peer"` or `"authority"` — who may call it. Default is authority-only.
- `"call_local"` — also run on the caller. Off by default, and forgetting it is
  the most common reason an RPC "does nothing" on the machine that sent it.
- `"reliable"` or `"unreliable"` / `"unreliable_ordered"`.

Call with `method.rpc(args)` or `method.rpc_id(peer, args)`.

**`MultiplayerSynchronizer`** replicates properties. Add the node, pick the
properties in the inspector, choose per-property sync or spawn-only. This
replaces `NetworkVariable` declarations, and being editor-driven means changing
what replicates does not touch code.

**`MultiplayerSpawner`** replicates instantiation. Point it at a parent node and
register spawnable scenes; children added on the authority appear on every peer.
This replaces prefab registration in the NetworkManager.

## Setting up a session

```gdscript
var peer := ENetMultiplayerPeer.new()
peer.create_server(7777)              # or peer.create_client(ip, 7777)
multiplayer.multiplayer_peer = peer

multiplayer.peer_connected.connect(_on_peer_connected)
```

`ENetMultiplayerPeer` is the default UDP transport. `WebSocketMultiplayerPeer`
and `WebRTCMultiplayerPeer` cover browser exports. All expose the same
`MultiplayerAPI`, so switching transport does not change gameplay code.

## Scope and honest limits

Both engines' built-in solutions are peer-to-peer or listen-server oriented and
neither ships a relay, matchmaking or dedicated-server hosting story — those are
services you add.

Godot has no equivalent to Netcode's network transforms with built-in
interpolation and prediction; `MultiplayerSynchronizer` replicates values, and
smoothing between them is yours to write. For anything competitive requiring
rollback or authoritative prediction, expect to build it in both engines.
