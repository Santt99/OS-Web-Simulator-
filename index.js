const express = require("express")
const app = express()
const server = require("http").Server(app)
const serverPort = 80
server.listen(serverPort,()=>{
    console.log("Server online and listening to port: " + serverPort)
})

const mysql = require("mysql")



app.get('/',(req,res)=>{
    res.sendFile(__dirname +"/public/views/login.html")
})
app.get('/login_style.css',(req,res)=>{
    res.sendFile(__dirname +"/public/styles/login_style.css")
})

const io = require("socket.io")(server)
io.on('connection',(socket)=>{
    console.log("Socket Connected!")
    socket.on('newMessage',(newMessage)=>{
        console.log(newMessage)
        io.sockets.emit("Update",newMessage)
    })
})


