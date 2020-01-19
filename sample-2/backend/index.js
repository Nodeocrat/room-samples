const express = require('express');
const http = require('http');
const Room = require('server-room');
const PORT = 3001;
const SID = 'connect.sid';
const session = require('express-session');
const bodyParser = require('body-parser');

/*
*  Initial app setup
*/
const app = express();
app.use(session({
  secret: 'secret',
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: false //Must pass this option if not using tls
  }
}));
app.use(express.static('../client'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());


// Reconnect: Many secnario's:
// ------------------------------
// 1. Client: reconnecting, Server: Timed out
// rejoin but no reinit. As far as the server is concerned, a full rejoin is necessary.
// I may add an optimization later on which allows a parameter to be set, to bypass the
// initialization. [this is an issue with both the old and the new version]. For now, the
// burden is on the subclasses to communicate that client has just rejoined on server,
// and must re-send the initialization.
// 2. Client: refreshed, Server: Not timed out
// no rejoin but need reinit most common case - client will call join() and be sent
// back in via onClientReconnect(), but the subclass will need a way of knowing that
// reinitialization is required... Just assume it is.
// 3. Client: reconnecting, Server: Not timed out
// no rejoin and no reinit. simplest case. onClientReconnect(). Reinitialization process
// will be sent back to client (for now). After got this working, pass thhrough a param.


// 3 will be the same as 2 for now. But later on, it will be improved and the
// client_initialization will get bypassed.

// 4. Client reconnect with new connection and is not present in server room
// (a new join; dealt with already)


/*
*  Room declaration/setup
*/
class ChatRoom extends Room.WithReadyCheck {
  constructor(){
    super({reconnectTimeout: 15000});
    this._users = new Map();
  }

  onClientReady(client){

    if(!client.id)
      this.leave(client);

    this._users.set(client.id, {username: client.id, status: 'ONLINE'});

    this.addListener(client, 'SEND_MSG', msg => {
      this.broadcast('USER_MSG', {username: client.id, text: msg});
    });
    this.broadcast('USER_JOINED', this._users.get(client.id), {exclude: new Set([client.sid])});

    this.sendInitialData(client);
  }

  onClientLeave(client){
    console.log(`user leaving: ${client.id}`);

    super.onClientLeave(client); // Must always call super for this hook
    this._users.delete(client.id);
    this.broadcast('USER_LEFT', {username: client.id});
  }

  /**
   * @warning
   * This may be called before the client has initialized, so be sure to check for the existence of user.
   */
  onClientDisconnect(client){
    super.onClientDisconnect(client); // Must always call super for this hook
    const user = this._users.get(client.id);
    if (user) {
      user.status = 'DISCONNECTED';
      this.broadcast('USER_DISCONNECTED', user);
    }
  }

  onClientReconnectReady(client){
    // Ask client to reconnect for now. Later: isInitialized param will come through.
    const user = this._users.get(client.id);
    user.status = 'ONLINE';
    this.broadcast('USER_RECONNECTED', user, {exclude: new Set([client.sid])});
    this.sendInitialData(client);
  }

  sendInitialData(client){
    this.emit(client, 'INIT', [...this._users.values()]); // Convert to array of user objects since Map objects cannot be converted to JSON
  }
}

const chatRoom = new ChatRoom();


/*
*  API
*/
app.post('/chatroom', (req, res) => {
  const result = chatRoom.join({cookie: req.headers.cookie, id: req.body.username});
  res.json(result);
});


/*
*  Finish setup & start http/websocket server
*/
const server = http.createServer(app);
Room.initialize(server, {sidHeader: SID});
server.listen(PORT, err => {
  if(err)
    return console.log(`Error: ${err}`);

  console.log(`Listening on ${PORT}`);
});
