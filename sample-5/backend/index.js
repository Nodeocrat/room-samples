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

    if(!client.id)
      this.leave(client);

    this._users.set(client.id, {username: client.id, status: 'ONLINE'});

    this.addListener(client, 'SEND_MSG', msg => {
      this.broadcast('USER_MSG', {username: client.id, text: msg});
    });
    this.broadcast('USER_JOINED', this._users.get(client.id));
    this.sendInitialData(client);
  }

  onClientLeave(client){
    super.onClientLeave(client); // Must always call super for this hook

    this._users.delete(client.id);
    this.broadcast('USER_LEFT', {username: client.id});
  }

  sendInitialData(client){
    this.emit(client, 'INIT', [...this._users.values()]); // Convert to array of user objects since Map objects cannot be converted to JSON
  }
}

const chatRooms = [];
for(let i = 0; i < 4; ++i)
  chatRooms.push(new ChatRoom());

/*
*  API
*/
const namesInUse = new Map();

// Simple auth-free login system, just to be able to set a session name
app.post('/login', (req, res) => {
  const username = req.body.username;
  if(!username || (namesInUse.get(username) && namesInUse.get(username) !== req.sessionID))
    return res.sendStatus(400);
  req.session.username = username;
  namesInUse.set(username, req.sessionID);
  res.sendStatus(200);
});

app.post('/logout', (req, res) => {
  namesInUse.delete(req.session.username);
  req.session.username = null;
  res.sendStatus(200);
});

//Same as before, but with a url parameter for the room we wish to join
app.post('/chatroom/:roomId', (req, res) => {
  const roomId = req.params.roomId;
  if(!roomId)
    return res.json({success:false, reason:'Room Id not provided'});
  if(!req.session.username)
    return res.json({success: false, reason:'Username not provided'});
  if(isNaN(roomId) || (roomId < 0 || roomId > 3))
    return res.json({success: false, reason: 'Invalid Room ID'});

  const result = chatRooms[roomId].join({cookie: req.headers.cookie, id: req.session.username});
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
