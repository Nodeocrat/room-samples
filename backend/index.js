const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const Room = require('server-room');
const ClientPool = Room.ClientPool;
const cookieParser = require('cookie-parser');
const PORT = 8080;

//*********** Move to different file ***************
class TestRoom extends Room {
  constructor(...args){
    super(...args);
  }

  _initClient(client){
    this._addListener(client, 'SEND_MSG', msg => {
      console.log(`received user message: ${msg}`);
      this.broadcast('USER_MSG', msg);
    });
    console.log(`TestRoom::_initClient: Client ${client.id} initialized`);
    super._initClient(client);
  }
}
//**************************************************

// Rooms
const testRoom = new TestRoom();

//Server setup
const app = express();
app.use(cookieParser());
app.post('/testroom', (req, res, next) => {
  const sid = req.cookies.sid;
  console.log(`sid: ${sid}`);
  const result = testRoom.join(sid, {id: sid.slice(6)});
  result.wsUrl = '/api/';
  res.json({...result});
  next();
});
const server = http.createServer(app);
const WebSocketServer = WebSocket.Server;
const wss = new WebSocketServer({ server });

wss.on('connection', (rawWs, req) => {
    //TODO if already connected to a game, you cannot connect again. [that'd have to be a database thing]
    //set IP on client req.headers: {"x-real-ip":"127.0.0.1","x-forwarded-for":"127.0.0.1", ...}

    // get session ID
    console.log(`cookie header: ${req.headers.cookie}`);
    let sid = "";
    const name = "sid=";
    const decodedCookie = decodeURIComponent(req.headers.cookie);
    const ca = decodedCookie.split(';');
    for(let i = 0; i <ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            sid = c.substring(name.length, c.length);
            break;
        }
    }

    console.log(`New websocket connection request from session ID ${sid}`);
    const clientInfo = ClientPool.getClient(sid);
    let client = clientInfo && clientInfo.client;
    if(!client){
      console.log(`Server is not expecting a websocket connection request from ${sid}`);
      return ws.terminate();
    }

    client.socket = rawWs;
    console.log(`Websocket connection successfully opened with session ID ${sid}`);

    /*  socket.on(EventTypes.DISCONNECT, () => {
          thisPlayer.leaveAllRooms();
          lobby.emit(EventTypes.PLAYER_LEFT, thisPlayer.publicProfile);
          players.delete(thisPlayer.username);
          console.log(`[INFO] ${thisPlayer.username} Disconnected.`);
        });
    */
});


server.listen(PORT, err => {
  if(err)
    return console.log(`Error: ${err}`);

  console.log(`Listening on ${PORT}`);
});
