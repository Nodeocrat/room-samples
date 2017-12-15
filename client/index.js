import ClientRoom from './node_modules/client-room/index.js';
import randomStr from './random-string.js';

class TestRoom {
  constructor(){
    this._room = new ClientRoom();
  }

  join(){
    return this._room.join('/api/testroom')
      .then(() => {
        this._room.on('USER_MSG', msg => console.log(`USER_MSG: ${msg}`));
        this._room.initialized();
      })
  }

  sendMsg(msg){
    this._room.emit('SEND_MSG', msg);
  }
}

document.cookie = encodeURIComponent(`sid=${randomStr()}; `);
const testRoom = new TestRoom();
testRoom.join()
  .then(() => testRoom.sendMsg(`Hi. I just joined the room at ${new Date()}`))
  .catch(err => console.log(err));
  /*.then(() => {
    //test socket
    const ws = testRoom._socket;
    ws.emit('client_msg', 'Hello from client');
    ws.on('server_msg', msg => console.log(msg));
  });*/
