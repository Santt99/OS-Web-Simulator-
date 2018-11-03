var socket = io.connect('http://localhost:8080', { 'forceNew': true });

function sendMessage(){
    let newMessage = document.getElementById("message").value
    socket.emit('newMessage',newMessage)
}

