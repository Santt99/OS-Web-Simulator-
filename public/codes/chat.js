var socket = io.connect('http://localhost', { 'forceNew': true });
var chatroom = document.getElementById("chatroom_div")
let newMessage = document.getElementById("message")
newMessage.addEventListener('keypress', function(e){
    if (e.keyCode == 13) {
      sendMessage() 
    }
  });
function sendMessage(){ 
    socket.emit('newMessage',newMessage.value)
    newMessage.value = "";
}
socket.on('Update',(message,username)=>{
    chatroom.innerHTML += "<p class='message'>" + username + ": " + message + "</p>"
    chatroom.scrollTo(0,chatroom.scrollHeight);
})
socket.on('loadChatC',(data)=>{
    chatroom.innerHTML = data
    chatroom.scrollTo(0,chatroom.scrollHeight);
})
setInterval(() => {
    saveChat("autosave.html")
}, 30000);

function saveChat(fileName){
    socket.emit('saveChat',chatroom.innerHTML,fileName)
}
