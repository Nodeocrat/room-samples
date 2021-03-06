import {ClientRoom} from './node_modules/client-room/index.js';

//Elements
const sendBtn = document.getElementById('send-btn');
const textInput = document.getElementById('text-input');
const loginBtn = document.getElementById('login-btn');
const loginView = document.getElementById('login');
const chatApp = document.getElementById('chat-app');
const nameInput = document.getElementById('username-input');
const messageContainer = document.getElementById('message-container');
const userListEle = document.getElementById('user-list');
const leaveBtn = document.getElementById('leave-btn');


/*
*   Room setup
*/
let chatRoom = null;
const userList = new Map();

loginBtn.addEventListener('click', login);
nameInput.addEventListener('keydown', e => e.keyCode === 13 ? login() : null);
sendBtn.addEventListener('click', sendMessage);
textInput.addEventListener('keydown', e => e.keyCode === 13 ? sendMessage() : null);
leaveBtn.addEventListener('click', leave);

function sendMessage(){
  chatRoom.emit('SEND_MSG', textInput.value);
  textInput.value = '';
}

function login(){
  // Request join
  chatRoom = new ClientRoom();
  chatRoom.join('/chatroom', {username: nameInput.value})
    .then(() => {
      //Socket events
      chatRoom.on('INIT', users => {
        for(let user of users)
          userList.set(user.username, user);
        renderUserList();
      });
      chatRoom.on('USER_JOINED', user => {
        userList.set(user.username, user);
        renderUserList();
        newMessage(`${user.username} joined`);
      });
      chatRoom.on('USER_LEFT', user => {
        userList.delete(user.username);
        renderUserList();
        newMessage(`${user.username} left`);
      });
      chatRoom.on('USER_MSG', msg => newMessage(msg));

      // Change view
      loginView.classList.add('hide');
      chatApp.classList.remove('hide');
      chatRoom.initialized();
    })
    .catch(err => console.log(err));
}



/*
*   Rendering functions
*/

/** @param
*   msg: {username: <String>, text: <String>}
*/
function newMessage(msg){

  const newMsg = document.createElement('div');
  newMsg.classList.add('message');
  if(msg.username){
    newMsg.innerHTML = `<span class="messageUsername">${msg.username}</span>
      <div>${msg.text}</div>`;
  } else {
    newMsg.innerHTML = `<div><i>${msg}</i></div>`;
  }
  messageContainer.appendChild(newMsg);

  messageContainer.scrollTop = messageContainer.scrollHeight - messageContainer.clientHeight;
}

function renderUserList(){
  userListEle.innerHTML = '';
  for(let [username] of userList)
    userListEle.innerHTML += `<div class="playerListItem">${username}</div>`;
}

function leave(){
  chatRoom.leave(); // This will cause you to leave the chatroom, and will automatically perform cleanup such as unregistering event listeners
  chatApp.classList.add('hide');
  loginView.classList.remove('hide');
  chatRoom = null;
  userList.clear();
}
