/*
*   Normally you should use web components for this and ChatRoom would extend
*   HTMLElement, or use React, but web component implementations are in alpha
*   stages at the moment, and React is too much to bother with for a small sample
*   so we use a regular ES6 class which when constructed, manipulates the DOM.
*/
import {ClientRoom} from './node_modules/client-room/index.js';

export default class ChatRoom {

  constructor(channel){
    if(isNaN(channel) || (channel < 0 || channel > 3))
      throw `Channel must be a number between 0 and 3 but got: ${channel}`;

    const root = document.createElement('div');
    const wrapper = document.createElement('span');
    wrapper.classList.add('wrapper');
    wrapper.appendChild(root);
    document.getElementById('chat-app').appendChild(wrapper);
    root.classList.add('chat-room-root');
    root.classList.add('flexContainer');
    this.root = root;
    this.room = new ClientRoom({url: `/chatroom/${channel}`});

    this.userList = new Map();
    this.renderJoinBtn();

    this.leave = this.leave.bind(this);
    this.sendMessage = this.sendMessage.bind(this);
    this.join = this.join.bind(this);
    this.renderJoinBtn = this.renderJoinBtn.bind(this);
    this.newMessage = this.newMessage.bind(this);
    this.renderChatRoom = this.renderChatRoom.bind(this);
    this.renderUserList = this.renderUserList.bind(this);

  }

  join(){
    console.log(`${typeof this}`)
    const room = this.room;
    room.join()
      .then(() => {
        //Socket events
        room.on('INIT', users => {
          for(let user of users)
            this.userList.set(user.username, user);
          this.renderUserList();
        });
        room.on('USER_JOINED', user => {
          this.userList.set(user.username, user);
          this.renderUserList();
          this.newMessage(`${user.username} joined`);
        });
        room.on('USER_LEFT', user => {
          this.userList.delete(user.username);
          this.renderUserList();
          this.newMessage(`${user.username} left`);
        });
        room.on('USER_MSG', msg => this.newMessage(msg));

        // Change view
        //TODO: Unhide the chatroom
        room.initialized();
        this.renderChatRoom();
      })
      .catch(err => console.log(err));
  }

  sendMessage(){
    this.room.emit('SEND_MSG', this.textInput.value);
    this.textInput.value = '';
  }

  renderJoinBtn(){
    while (this.root && this.root.firstChild)
      this.root.removeChild(this.root.firstChild);

    const btnContainer = document.createElement('div');
    btnContainer.classList.add('center');
    const joinBtn = document.createElement('button');
    joinBtn.setAttribute('class', 'btn btn-green btn-bordered');
    joinBtn.innerHTML = 'Join Room';
    joinBtn.addEventListener('click', () => this.join());
    btnContainer.appendChild(joinBtn);
    this.root.appendChild(btnContainer);
  }

  renderChatRoom(){
    while (this.root && this.root.firstChild)
      this.root.removeChild(this.root.firstChild);

    const markup = document.getElementById('chat-room-template').content;
    this.root.appendChild(markup.cloneNode(true));

    //Save references for elements which need to be used elsewhere
    this.textInput = this.root.querySelector('.text-input');

    this.root.querySelector('.send-btn').addEventListener('click', this.sendMessage);
    this.textInput.addEventListener('keydown', e => e.keyCode === 13 ? this.sendMessage() : null);
    this.root.querySelector('.leave-btn').addEventListener('click', this.leave);
  }

  newMessage(msg){
    const messageContainer = this.root.querySelector('.message-container');

    // If we are already scrolled to the bottom, then auto scroll so we dont have to
    // manually scroll to see new messages. Otherwise leave the scroller where it is.
    const autoScroll =
      messageContainer.scrollTop === messageContainer.scrollHeight - messageContainer.clientHeight ?
      true : false;

    const newMsg = document.createElement('div');
    newMsg.classList.add('message');
    if(msg.username){
      newMsg.innerHTML = `<span class="messageUsername">${msg.username}</span>
        <div>${msg.text}</div>`;
    } else {
      newMsg.innerHTML = `<div><i>${msg}</i></div>`;
    }
    messageContainer.appendChild(newMsg);

    if(autoScroll)
      messageContainer.scrollTop = messageContainer.scrollHeight - messageContainer.clientHeight;
  }

  renderUserList(){
    const userListEle = this.root.querySelector('.user-list');

    userListEle.innerHTML = '';
    for(let [username] of this.userList)
      userListEle.innerHTML += `<div class="playerListItem">${username}</div>`;
  }

  leave(){
    this.room.leave();
    this.userList.clear();
    this.renderJoinBtn();
  }
}
