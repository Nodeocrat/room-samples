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


/*
*  Room declaration/setup
*/
class ChatRoom extends Room {
  constructor(){
    super({reconnectTimeout: 10000});
    this._users = new Map();
  }

  initClient(client){
    super.initClient(client); // Must always call super for this hook

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

  onClientDisconnect(client){
    super.onClientDisconnect(client); // Must always call super for this hook
    const user = this._users.get(client.id);
    user.status = 'DISCONNECTED';
    this.broadcast('USER_DISCONNECTED', user);
  }

  onClientReconnect(client){
    super.onClientReconnect(client);
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
