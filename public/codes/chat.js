var socket = io.connect('http://localhost:8080');
var chatroom = document.getElementById("chatroom")
function sendMessage(){
    let newMessage = document.getElementById("message").value
    socket.emit('newMessage',newMessage)
    
}
socket.on('Update',(message)=>{
    chatroom.innerHTML += "<p class='message'>" + message + "</p>"
})
