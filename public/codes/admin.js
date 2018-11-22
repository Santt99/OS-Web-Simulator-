var socket = io.connect('http://10.7.49.42:8080', { 'forceNew': true });

socket.emit('loadTable')
let table = document.getElementById('table_table')
socket.on('load',(users)=>{
    
    for(i in users){
        table.innerHTML = 
        table.innerHTML +
        "<tr> "+
        "<td class='tableBody1'>"+ users[i].userName +"</td>"+
        "<td class='tableBody1'>"+ users[i].userPassword +"</td>"+
        "</tr>"
    }
})
function changeUserData(){
    let newUserName = document.getElementById("newUserName_input").value
    let newUserPassword = document.getElementById("newUserPassword_input").value
    if(newUserName == null || newUserPassword == null) alert("write th new username and password, if you dont want to change some of this data just write the same")
    socket.emit('changeUserData',newUserName,newUserPassword)
}
function deleteUser(){
    let user = document.getElementById("deleteUser_input").value
    if(user == null) alert("write a correct username")
    socket.emit('deleteUser',user)
}

function newUser(){
    let newUserName = document.getElementById("newUserName_input").value
    let newUserPassword = document.getElementById("newUserPassword_input").value
    socket.emit('newUser',newUserName,newUserPassword)
}