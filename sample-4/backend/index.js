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
    secure: false // must pass this option if not using tls
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
    super();
    this._users = new Map();
  }

  initClient(client){
    super.initClient(client); // Must always call super for this hook

    const user = this._users.get(client.id);
    if(!user)
      return this.leave(client);

    user.status = 'ONLINE';

    this.addListener(client, 'SEND_MSG', msg => {
      this.broadcast('USER_MSG', {username: client.id, text: msg});
    });

    this.broadcast('USER_INITIALIZED', this._users.get(client.id));
    this.emit(client, 'INIT', [...this._users.values()]); // Convert to array of user objects since Map objects cannot be converted to JSON
  }

  onClientAccepted(client){
    super.onClientAccepted(client); // Always call super for this hook

    if(!client.id)
      return console.log('Cannot create client with empty id');

    const newUser = {username: client.id, status: 'INITIALIZING'};
    this._users.set(client.id, newUser);
    this.broadcast('USER_JOINED', newUser);
  }

  onClientLeave(client){
    super.onClientLeave(client); // Must always call super for this hook

    this._users.delete(client.id);
    this.broadcast('USER_LEFT', {username: client.id});
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
