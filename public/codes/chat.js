var socket = io.connect('http://localhost:8080', { 'forceNew': true },()=>{
    loadChat("autosave.html")
});
var chatroom = document.getElementById("chatroom_div")
function sendMessage(){
    let newMessage = document.getElementById("message").value
    socket.emit('newMessage',newMessage)
    
}
socket.on('Update',(message,username)=>{
    chatroom.innerHTML += "<p class='message'>" + username + ": " + message + "</p>"
})
socket.on('loadChatC',(data)=>{
    chatroom.innerHTML = data
})
setInterval(() => {
    saveChat("autosave.html")
}, 30000);

function saveChat(fileName){
    socket.emit('saveChat',chatroom.innerHTML,fileName)
}