var socket = io.connect('http://localhost:8080', { 'forceNew': true });
var chatroom = document.getElementById("chatroom_div")
var tableC = document.getElementById("table_table2")

filesB()
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
    filesB();
}
function changeUserData(){
    let newUserName = document.getElementById("newUserName_input").value
    let newUserPassword = document.getElementById("newUserPassword_input").value
    if(newUserName == null || newUserPassword == null) alert("write th new username and password, if you dont want to change some of this data just write the same")

    socket.emit('changeUserData',newUserName,newUserPassword)
}
function filesB(){
    socket.emit('loadFiles',()=>{
    })
}
function loadCustomChat(fileName){
    socket.emit('customChat',fileName)
}
function deleteChat(fileName){
    socket.emit('deleteFile',fileName)
}

socket.on('fileTable',(file)=>{
    tableC.innerHTML = "<tr><td>File Name</td></tr>"
    for(i in file){
        
        tableC.innerHTML = 
        tableC.innerHTML +
        "<tr> "+
        "<td>"+ file[i].fileName +"</td>"+
        "</tr>"
    }
})
