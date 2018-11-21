const bodyParser = require("body-parser")
const mysql = require("mysql")
const fs = require('fs');
const express = require("express")
const app = express()
const server = require("http").Server(app)
const serverPort = 8080

var userName
server.listen(serverPort,()=>{
    console.log("Server online and listening to port: " + serverPort)
})
const io = require("socket.io")(server)
app.use(bodyParser.urlencoded({ extended: false }))

var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: ""
});
con.connect(function(err) {
    if (err) throw err;
    console.log("Connected!");
    
});

app.get('/',(req,res)=>{
    res.sendFile(__dirname +"/public/views/login.html")
})
app.get('/styles/login_style.css',(req,res)=>{
    res.sendFile(__dirname +"/public/styles/login_style.css")
})
app.get('/styles/chat_style.css',(req,res)=>{
    res.sendFile(__dirname +"/public/styles/chat_style.css")
})

app.post('/home',(req,res)=>{
    userName = req.body.userName
    let userPassword = req.body.userPass
    console.log('SELECT * FROM users.userData WHERE userName = ' + mysql.escape(userName) +' AND userPassword = ' + mysql.escape(userPassword))
    con.query('SELECT * FROM users.userData WHERE userName = ' + mysql.escape(userName) +' AND userPassword = ' + mysql.escape(userPassword),(err,result,fields)=>{
        if(err) throw err
        if(result.length > 0){
            console.log(result[0].userName)
            console.log(result[0].userPassword)
            if(result[0].userName == userName && result[0].userPassword == userPassword){
                res.redirect('/chat')
                res.end()
            }
        }else{
            res.redirect('/')
            res.end()
        }
    })
    
})
app.post('/register',(req,res)=>{
    let newUserName = req.body.newUserName
    let newUserPassword = req.body.newUserPass
    let userType = "user"
    con.query('SELECT * FROM users.userData WHERE userName = ' + mysql.escape(newUserName),(err,result,fields)=>{
        if(err) throw err
        if(result.length > 0){
            res.write('choose another username')
            res.end()
        }else{
            con.query('INSERT INTO users.userData (userType,userName,userPassword) VALUES (' + mysql.escape(userType) + ','+ mysql.escape(newUserName) + ',' + mysql.escape(newUserPassword) +')',(err,result,fields)=>{
                if(err) throw err
        
                res.redirect('/')
            })
            fs.mkdir(__dirname + '/savedChats/' + newUserName,(err)=>{
                if(err) throw err;
            })
            fs.writeFile(__dirname + '/savedChats' + '/'+ newUserName + '/' + 'autosave.html',data,(err)=>{
                if(err) throw err;
            })
        }
    })
    
})

io.on('connection',(socket)=>{
    socket.username = userName;
    fs.readFile(__dirname + '/savedChats' + '/'+ socket.username + '/' + 'autosave.html','utf8',(err,data)=>{
        if(err) throw err
        if(data == "") return;
        socket.emit('loadChatC',data)
    })
    console.log("Socket Connected!")
    socket.on('newMessage',(newMessage)=>{
        io.sockets.emit("Update",newMessage,socket.username)
    })
    socket.on('saveChat',(data,fileName)=>{
        fs.writeFile(__dirname + '/savedChats' + '/'+ socket.username + '/' + fileName,data,(err)=>{
            if(err) throw err;
        })
    })
    socket.on('loadChat',(fileName)=>{
        fs.readFile(__dirname + '/savedChats' + '/'+ socket.username + '/' + fileName,'uft8',(err,data)=>{
            if(err) throw err
            socket.emit('loadChatC',data)
        })
    })
})
app.get('/chat',(req,res)=>{
    res.sendFile(__dirname + "/public/views/chat.html")
    
})
app.get('/codes/chat.js',(req,res)=>{
    res.sendfile(__dirname + "/public/codes/chat.js")
})



