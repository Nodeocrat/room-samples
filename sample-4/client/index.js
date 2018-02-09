import ChatRoom from './chat-room.js';

//Elements
const loginBtn = document.getElementById('login-btn');
const loginView = document.getElementById('login');
const chatApp = document.getElementById('chat-app');
const nameInput = document.getElementById('username-input');
const logoutBtn = document.getElementById('logout-btn');


/*
*   High level app setup
*/

loginBtn.addEventListener('click', login);
nameInput.addEventListener('keydown', e => e.keyCode === 13 ? login() : null);
logoutBtn.addEventListener('click', logout);

const chatRooms = [];
for(let i = 0; i <= 3; ++i)
  chatRooms.push(new ChatRoom(i));

// No authentication necessary. Just set a username for this session.
function login(){
  // Request join
  fetch('/login', {headers: {'Content-Type': 'application/json'}, method: 'POST', credentials: 'include', body: JSON.stringify({username: nameInput.value})})
    .then(() => {
      loginView.classList.add('hide');
      chatApp.classList.remove('hide');
    })
    .catch(err => console.log(err));
}

function logout(){
  for(let chatRoom of chatRooms)
    chatRoom.leave();

  fetch('/logout', {method: 'POST', credentials: 'include'})
    .then(() => {
      loginView.classList.remove('hide');
      chatApp.classList.add('hide');
      //while (chatApp.firstChild)
      //  chatApp.removeChild(chatApp.firstChild);
    })
    .catch(err => console.log(err));
}
