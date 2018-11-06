var socket = io.connect('10.7.50.243:80');
var chatroom = document.getElementById("chatroom")
function sendMessage(){
    let newMessage = document.getElementById("message").value
    socket.emit('newMessage',newMessage)
    
}
socket.on('Update',(message)=>{
    chatroom.innerHTML += "<p class='message'>" + message + "</p>"
})
