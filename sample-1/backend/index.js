const express = require('express');
const http = require('http');
const Room = require('server-room');
const PORT = 8080;
const SID = 'sid';
const IP_HEADER = 'x-real-ip';

class TestRoom extends Room {
  initClient(client){
    super.initClient(client);
    this.addListener(client, 'SEND_MSG', msg => {
      console.log(`received user message: ${msg}`);
      this.broadcast('USER_MSG', msg);
    });
    console.log(`TestRoom::_initClient: Client ${client.id} initialized`);
    this.broadcast('USER_JOINED', client.id);
  }

  onClientLeave(client){
    super.onClientLeave(client);
    this.broadcast('USER_LEFT', client.id);
  }
}

// Rooms
const testRoom = new TestRoom();

//Server setup
const app = express();
app.post('/testroom', (req, res) => {
  const result = testRoom.join({cookie: req.headers.cookie});
  result.url = '/api/';
  res.json(Object.assign({}, result));
});

const server = http.createServer(app);
Room.initialize(server, {sidHeader: SID, ipHeader: IP_HEADER});

server.listen(PORT, err => {
  if(err)
    return console.log(`Error: ${err}`);

  console.log(`Listening on ${PORT}`);
});
