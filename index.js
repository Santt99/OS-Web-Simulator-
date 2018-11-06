const express = require("express")
const app = express()
const server = require("http").Server(app)
const io = require("socket.io")(server)
const mysql = require("mysql")
const serverPort = 8080;


app.get('/',(req,res)=>{
    res.sendFile(__dirname +"/public/views/chat.html")
})
app.get('/codes/chat.js',(req,res)=>{
    res.sendfile(__dirname + "/public/codes/chat.js")
})
io.on('connection',(socket)=>{
    console.log("Socket Connected!")
    socket.on('newMessage',(newMessage)=>{
        console.log(newMessage)
        io.sockets.emit("Update",newMessage)
    })
})

server.listen(serverPort,()=>{
    console.log("Server online and listening to port: " + serverPort)
})
