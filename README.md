# SERVER
[DESCRIPTION]
Note: do not confuse Client (abstraction for connection info of each connected client, for the backend) with CLIENT (front-end).

## Class: Room

This class represents a room of clients. This is intended to be extended from.

### new Room(options)
- `options` {Object}
  - `initTimeout` {Number} Milliseconds for client to notify initialization is complete (via initialize() on client) before being kicked. Defaults to 10 seconds. If 0 is passed, then initClient will be called straight away and will not wait for the client to invoke initialized(). This is faster and useful for if there is no initial data that needs to be sent to the client.
  - `reconnectTimeout` {String} Time in milliseconds that clients have to reconnect upon disconnect. If ${timeout} seconds passes without reconnecting, client will be booted from room. (default 0ms). If it set to be non-zero, then you will be on 'reconnect' mode and must override onDisconnect and onReconnect

### Room.onClientAccepted(client) `hook`
Called when client is accepted & expected to join shortly, but not yet initialized. Always call super when using this hook.

### Room.onClientDisconnect(client)
Called when a client disconnects. This does not need to be overidden if reconenctTimeout is set to zero, as leave will be called instantly (but onClientDisconnect will still be called just before)

### Room.onClientReconnect(client)
When client reconnects, after being disconnected. As above, you only need to override this if reconnectTimeout is non-zero.

### Room.initClient(client)
Hook for when client is initialized on client side. This is the time to register socket events on server side with client. Also optionally you can choose to emit initial startup data (if required) along with an event to tell user the server is also initialized, such as in a game. But note, when at this point, the user is already receiving the rooms events, but cannot emit anything yet. Whether or not you want the user to react to those events or wait for initial startup data and a startup signal is a choice to be made by you!

### Room.onClientLeave(client)
When client leaves. Be aware that this may happen any time after onClientAccepted even before the client has initialized

### Room.onJoinRequest(client, userInfo)
Return true if permission granted to join, false otherwise. If not overidden, permission is always granted. Do not call super when using this hook.

## Class: Client
This class represents a client. It holds information only about the client connection and device, and optionally the ID of the user it is for, but nothing else about the user. This class should never be used to create new clients, and you do not have access to the class itself, but only objects of the class via the overidden methods in `Room`.

### Client.id

### Client.sid

### Client.ip

### Client.rooms

### Client.in(inputRoom)

### Client.leaveAllRooms()


# CLIENT
