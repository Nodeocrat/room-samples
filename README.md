# SERVER
This is the server-side package of the room package. Samples can be found [here].

Note: do not confuse Client (abstraction for connection info of each connected client, for the backend) with CLIENT (front-end).

## Class: Room

This class represents a room of clients. This is intended to be extended.

### new Room(options)
- `options` {Object}
  - `initTimeout` {Number} Milliseconds for client to notify initialization is complete (via `initialized()` on client) before being kicked. Defaults to 10 seconds. If 0 is passed, then initClient will be called straight away and will not wait for the client to invoke `initialized()`. This is faster and useful for if there is no initial data that needs to be sent to the client.
  - `reconnectTimeout` {String} Time in milliseconds that clients have to reconnect upon disconnect. If this amount of time passes without reconnecting, the client will be kicked from the room. (default 0ms). If it set to be non-zero, then you should override `Room.onDisconnect(client)` and `Room.onReconnect(client)` to react to disconnects and reconnects.

### Room.hasClient(client)
- `client` {Client}  

Return true if `client` is in room, regardless of connection or initialization state.

### Room.isConnected(client)
- `client` {Client}  

Returns true if `client` is connected

### Room.getClientBySid(sid)
- `sid` {String} a string representing a session ID of a client.  

Returns the `client` with the clients SID equal to `sid`.

### Room.leave(client)
- `client` {Client}  

Forces the `client` to leave. This will trigger `Room.onClientLeave(client)` to be called.

### Room.kickAll()
Convenience method to force all clients in room to leave, calling `Room.leave(client)` on each client.

### Room.broadcast(event, payload)
- `event` {String}  
- `payload` {Object, String, Boolean, Array, Number} (optional)  

Broadcasts `event` with optional `payload` to every connected and initialized client in the room.

### Room.emit(client, event, payload)
- `client` {Client}  
- `event` {String}  
- `payload` {Object, String, Boolean, Array, Number} (optional)  

Emits `event` to `client` with optional `payload`.

### Room.addListener(client, event, listener)
- `client` {Client}  
- `event` {String}  
- `listener` {Function}  

Adds the event listener `listener` to client `client` for event `event`.

### Room.join(userInfo)
- `userInfo` {Object} Contains info about the user wishing to join. Either a property `sid` (a session ID string) or a property `cookie` must be set. If `cookie` is set, this must be a valid cookie string from which the session ID can be extracted, and `sidHeader` must have been set in `initialize(options)`.

Triggers the join process, invoking `Room.onJoinRequest(client, userInfo)`, and `onClientAccepted(client)` (if `onJoinRequest` returns true) before returning. Returns an object: `{success: {Boolean}, reason: {String} }`. success will be `true` if onJoinRequest returned `true` and the SID given is not already found to be in the room. Otherwise returns success: `false` with a `reason` property set, 

### Hook: Room.onJoinRequest(client, userInfo)
- `client` {Client}  
- `useInfo` {Object} same object given to `Room.join`
.
Return `{success: true}` if you want the user with `userInfo` to join. If not overidden, permission is always granted to join. Do not call super when using this hook. If `true` is returned, the `Room.onClientAccepted` hook below, will be triggered. Return an optional `reason` property if you wish to specify a reason why the user has not been accepted (with `success: false`)

### Hook: Room.onClientAccepted(client) 
- `client` {Client}  

Called when client is accepted & expected to join shortly, but not yet initialized. Always call super when using this hook.

### Hook: Room.initClient(client)
- `client` {Client}  

Hook for when client is initialized on client side. This is the time to register socket events on server side with client. Also optionally you can choose to emit initial startup data (if required). Note: This is called after the client side has called `initialized()` so it can be assumed the client is already initialized and is receiving events whenever `Room.broadcast` is called.

### Hook: Room.onClientLeave(client)
- `client` {Client}  

When client leaves. Be aware that this may happen any time after onClientAccepted even before the client has initialized

### Hook: Room.onClientDisconnect(client)
- `client` {Client}  

Called when a client disconnects. This does not need to be overidden if reconenctTimeout is set to zero, as leave will be called instantly (but onClientDisconnect will still be called just before)

### Hook: Room.onClientReconnect(client)
- `client` {Client}  

When client reconnects, after being disconnected. As above, you only need to override this if reconnectTimeout is non-zero.


## Class: Client
This class represents a client. It holds information only about the client connection and device, and optionally the ID of the user it is for, but nothing else about the user. This class should never be used to create new clients, and you do not have access to the class itself, but only objects of the class via the overidden methods in `Room`. 

### Client.sid
Returns the SID string which the client represents. Clients objects and SID strings have a one to one relationship.

### Client.id
Returns the id string which is the same as the id string passed in in join()'s `userInfo` argument `id` property. The ID can represent whatever you want, but in most typical cases will represent the ID of a user account which can, if you allow in the subclass, have multiple clients representing it (across different sessions).

### Client.ip
Returns the ip string of the client.

### Client.rooms
Returns an ES6 Map of Room.id -> Room.

### Client.in(room)
- `room` {Room}  

Returns `true` if client is in `room`, otherwise returns `false`.

### Client.leaveAllRooms()
Causes client to leave all rooms it is currently in.


# CLIENT
[DESCRIPTION]

## Class: ClientRoom

### new ClientRoom()
Created a new ClientRoom object, which is designed to be the client-side counterpart of the Server-side Room class.

### ClientRoom.id



Do not use these reserved events on either client or server, as they are used behind the scenes and may cause undesirable side effects for the user
- CLIENT_INITIALIZED
- EXIT
- disconnect
- reconnect
- connect
