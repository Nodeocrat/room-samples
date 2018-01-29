# SERVER
## Class: Room

This class represents a WebSocket server. It extends the `EventEmitter`.

### new Room(options)

- `initTimeout` {Number} Milliseconds for client to notify initialization is complete (via initialize() on client) before being kicked. Defaults to 10 seconds. If 0 is passed, then initClient will be called straight away and will not wait for the client to invoke initialized(). This is faster and useful for if there is no initial data that needs to be sent to the client.
  - `reconnectTimeout` {String} Time in milliseconds that clients have to reconnect upon disconnect. If ${timeout} seconds passes without reconnecting, client will be booted from room. (default 0ms). If it set to be non-zero, then you will be on 'reconnect' mode and must override onDisconnect and onReconnect
  - `port` {Number} The port where to bind the server.
  - `backlog` {Number} The maximum length of the queue of pending connections.
  - `server` {http.Server|https.Server} A pre-created Node.js HTTP server.
  - `verifyClient` {Function} A function which can be used to validate incoming
    connections. See description below.
  - `handleProtocols` {Function} A function which can be used to handle the
    WebSocket subprotocols. See description below.
  - `path` {String} Accept only connections matching this path.
  - `noServer` {Boolean} Enable no server mode.
  - `clientTracking` {Boolean} Specifies whether or not to track clients.
  - `perMessageDeflate` {Boolean|Object} Enable/disable permessage-deflate.
  - `maxPayload` {Number} The maximum allowed message size in bytes.
- `callback` {Function}
  
## onClientAccepted
When client is accepted & expected to join shortly, but not yet initialized

## onClientDisconnect
When client disconnects. This does not need to be overidden if reconenctTimeout is set to zero, as leave will be called instantly (but onClientDisconnect will still be called just before)

## onClientReconnect
When client reconnects, after being disconnected. As above, you only need to override this if reconnectTimeout is non-zero.

## initClient
Hook for when client is initialized on client side. This is the time to register socket events on server side with client. Also optionally you can choose to emit initial startup data (if required) along with an event to tell user the server is also initialized, such as in a game. But note, when at this point, the user is already receiving the rooms events, but cannot emit anything yet. Whether or not you want the user to react to those events or wait for initial startup data and a startup signal is a choice to be made by you!

## onClientLeave
When client leaves. Be aware that this may happen any time after onClientAccepted even before the client has initialized

## onJoinRequest
(Do not call super) Return true if permission granted to join, false otherwise. If not overidden, permission is always granted


# CLIENT
