# SERVER SIDE MODULE
This is the server-side module of the room package.

Note: do not confuse Client (abstraction for connection info of each connected client, for the backend) with CLIENT (front-end).

### initialize(server, [options])
- `server` {Object}
- `options` {Object}
  - `sidHeader` {String} the cookie string name for the session ID (defaults to 'sid')
  - `ipHeader` {String} the header name for the IP address of the client.

To start the Room websocket server, you must call `Room.initialize(server, {sidHeader: SID});` (where `Room` is the imported module). The ipHeader is optional, but if you include it, an ip address will be included  in the userInfo parameter passed to Room.onJoinRequest and Room.onClientAccepted, as well as it being inlucded in logging output where relevant. If `ipHeader` is not included, the Room pakcage will try to guess it, which usually works if you are not using a proxy, but if you are, rarely works.

## Class: Room

This class represents a room of clients. This is intended to be extended.

### new Room([options])
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

### Room.broadcast(event[, payload])
- `event` {String}  
- `payload` {Object, String, Boolean, Array, Number} (optional)  

Broadcasts `event` with optional `payload` to every connected and initialized client in the room.

### Room.emit(client, event[, payload])
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

Triggers the join process, invoking `Room.onJoinRequest(client, userInfo)`, and `onClientAccepted(client)` (if `onJoinRequest` returns true) before returning. Returns an object: `{success: {Boolean}, reason: {String} }`. success will be `true` if onJoinRequest returned `true` and the SID given is not already found to be in the room. Otherwise returns success: `false` with a `reason` property set. Including an optional 'id' property will set the resulting Client objects id to this. Otherwise the clients id property will return the session ID it represents.

### Client Hook: Room.onJoinRequest(userInfo)
- `useInfo` {Object} same object given to `Room.join`

Return `{success: true}` if you want the user with `userInfo` to join. If not overidden, permission is always granted to join. Do not call super when using this hook. If `true` is returned, the `Room.onClientAccepted` hook below, will be triggered. Return an optional `reason` property if you wish to specify a reason why the user has not been accepted (with `success: false`)

### Client Hook: Room.onClientAccepted(client, userInfo) 
- `client` {Client}  
- `userInfo` {Object} the same object as in Room.onJoinRequest

Called when client is accepted & is now guaranteed a spot in the room, but the websocket connection may not be up yet. Always call super when using this hook. You may register socket events here if you do not have to send initial state; it will save half a round trip compared to onClientConnect, if the client does not have an active websocket connection yet.

### Client Hook: Room.onClientConnect(client)
- `client` {Client}  

Called when client websocket connection is up. You should register socket events here if you need to send initial data.

### Client Hook: Room.onClientLeave(client)
- `client` {Client}  

When client leaves. Be aware that this may happen any time after onClientAccepted, even before the client has an active websocket connection.

### Client Hook: Room.onClientDisconnect(client)
- `client` {Client}  

Called when a client disconnects. This does not need to be overidden if reconenctTimeout is set to zero, as leave will be called instantly (but onClientDisconnect will still be called just before).

### Client Hook: Room.onClientReconnect(client)
- `client` {Client}  

When client reconnects, after being disconnected. As above, you only need to override this if reconnectTimeout is non-zero.


## Class: Client
This class represents a client. It holds information only about the client connection and device, and optionally the ID of the user it is for, but nothing else about the user. This class should never be used to create new clients, and you do not have access to the class itself, but only objects of the class via the overidden methods in `Room`. 

### Client.sid
Returns the SID string which the client represents. Clients objects and SID strings have a one to one relationship.

### Client.id
Returns the id string which is the same as the id string passed in in join()'s `userInfo` argument `id` property. The ID can represent whatever you want, but in most typical cases will represent the ID of a user account which can, if you allow in the subclass, have multiple clients representing it (across different sessions).

### Client.ip
Returns the ip string of the client. This will be set automatically if you have provided a ipHeader property for the header which represents the header, otherwise the Room module will try to work it out itself (rarely works if using proxies).

### Client.rooms
Returns an ES6 Map of Room.id -> Room.

### Client.in(room)
- `room` {Room}  

Returns `true` if client is in `room`, otherwise returns `false`.

### Client.leaveAllRooms()
Causes client to leave all rooms it is currently in.


# CLIENT SIDE MODULE

## Class: ClientRoom
Class representing a client side Room for a corresponding back-end Room.

### new ClientRoom()
Created a new ClientRoom object, which is designed to be the client-side counterpart of the Server-side Room class.

### ClientRoom.id
Returns the ID of the room.

### ClientRoom.join(url[, payload])
- `url` {String} The url of the room you wish to join
- `payload` {Object, String, Boolean, Array, Number} (optional) The post body

Sends a POST request to the server to request joining the room. Returns a `Promise` which resolves with a `response` from the server: `{success: {Boolean}, reason: {String} }` where success is `true` if you have successfully joined the room, and  `false` otherwise, with the `reason` of the failure. The response of the POST request on the server-side must be sent back as JSON to satisfy this. If the join request fails, the `Promise` will throw an error string representing the reason of the failure.

### ClientRoom.on(event, listener)
- `event` {String} An event fired from the corresponding server-side Room.
- `listener` {Function} Event listener

Registers `listener` with `event`, which will be called when `event` is fired from the corresponding `Room` on the server.

### ClientRoom.initialized()
Call this to notify the server you have fully initialized, with all relevant event listeners and anything else set up. This must be called after the `ClientRoom.join(url)` Promise has resolved with `{success: true}`.

### ClientRoom.emit(event[, payload])
- `event` {String}
- `payload` {Object, String, Boolean, Array, Number} (optional)

Emits `event` with `payload` to corresponding room on server.

### ClientRoom.leave()

Causes the client to leave the room.



Do not use these reserved events on either client or server, as they are used behind the scenes and may cause undesirable side effects for the user such as being booted from the room.
- `EXIT`
- `CLIENT_INITIALIZED`
