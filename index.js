const bodyParser = require("body-parser")
const mysql = require("mysql")
const fs = require('fs');
const express = require("express")
const app = express()
const server = require("http").Server(app)
const serverPort = 8080
var users
var userName
var files
var ID
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
//Main Page
app.get('/',(req,res)=>{
    res.sendFile(__dirname +"/public/views/login.html")
})
app.get('/styles/login_style.css',(req,res)=>{
    res.sendFile(__dirname +"/public/styles/login_style.css")
})

//Chat Page
app.get('/chat/:id',(req,res)=>{
        if(req.params.id == 1){
            con.query("SELECT fileName FROM users.savedchats WHERE ownerId=" + mysql.escape(ID) + " AND fileName <> 'autosave.html'",(err,result,fields)=>{
                if(err) throw err
                files = result
            })
            res.sendFile(__dirname + "/public/views/chat.html")
        }else{
            redirect('/')
        }
    
})
app.get('/styles/chat_style.css',(req,res)=>{
    res.sendFile(__dirname +"/public/styles/chat_style.css")
})

app.get('/codes/chat.js',(req,res)=>{
    res.sendfile(__dirname + "/public/codes/chat.js")
})

//Admin Page
app.get('/admin/:id',(req,res)=>{
    if(req.params.id == 2){
        res.sendFile(__dirname + '/public/views/admin.html')
        con.query("SELECT userName, userPassword FROM users.userdata WHERE userName <> 'admin' ",(err,result,fields)=>{
        if(err) throw err
        users = result;
        })
    }
})
app.get('/styles/admin_style.css',(req,res)=>{
    res.sendFile(__dirname +"/public/styles/admin_style.css")
})
app.get('/codes/admin.js',(req,res)=>{
    res.sendfile(__dirname + "/public/codes/admin.js")
})
app.post('/home',(req,res)=>{
    userName = req.body.userName
    let userPassword = req.body.userPass
    con.query('SELECT * FROM users.userData WHERE userName = ' + mysql.escape(userName) +' AND userPassword = ' + mysql.escape(userPassword),(err,result,fields)=>{
        if(err) throw err
        if(result.length > 0){
            ID = result[0].id
            if(result[0].userName == userName && result[0].userPassword == userPassword){
                if(result[0].userType == "user"){
                    res.redirect('/chat/1')
                    res.end()
                }else{
                    res.redirect('/admin/2')
                    res.end()
                }
                
            }else{
                res.redirect('/')
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
            
           
        }
    })
    
})

io.on('connection',(socket)=>{
    socket.username = userName;
    fs.readFile(__dirname + '/savedChats' + '/'+ socket.username + '/' + 'autosave.html','utf8',(err,data)=>{
        if(err){
            if(err.code = 'ENOENT'){
                fs.writeFile(__dirname + '/savedChats' + '/'+ socket.username + '/' + 'autosave.html',data,(err)=>{
                    if(err) console.log(err);
                })
            }
        }
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
            con.query('SELECT * FROM users.savedchats WHERE fileName=' + mysql.escape(fileName) + 'AND ownerId=' + mysql.escape(ID),(err,res,fields)=>{
                if(err) throw err
                if(res <= 0){
                    con.query('INSERT INTO users.savedchats (ownerId,fileName) VALUES(' + mysql.escape(ID) + ',' + mysql.escape(fileName) + ')', (err)=>{
                        if(err) throw err;
                    })
                }
            })
        })
    })
    socket.on('loadChat',(fileName)=>{
        fs.readFile(__dirname + '/savedChats' + '/'+ socket.username + '/' + fileName,'uft8',(err,data)=>{
            if(err) throw err
            socket.emit('loadChatC',data)
        })
    })
    socket.on('changeUserData',(newUserName,newPassword)=>{
        fs.rename(__dirname + '/savedChats' + '/' + socket.username, __dirname + '/savedChats' + '/' + newUserName,(err)=>{
            if(err) throw err
        })
        con.query('UPDATE users.userData SET userName=' + mysql.escape(newUserName) + ',userPassword=' + mysql.escape(newPassword) + 'WHERE userName=' + mysql.escape(socket.username),(err)=>{
            if(err) throw err
        })
        socket.username = newUserName;
    })
    socket.on('loadTable',()=>{
        socket.emit('load',users)
    })
    socket.on('deleteUser',(user)=>{
        con.query('DELETE FROM users.userdata WHERE userName=' + mysql.escape(user),(err)=>{
            if(err) throw err
        })
        fs.rename(__dirname + '/savedChats' + '/' + user, __dirname + '/savedChats' + '/' + user + '_old',(err)=>{
            if(err) throw err
        } )
    })
    socket.on('loadFiles',()=>{
        
        socket.emit('fileTable',files)
        
    })
    socket.on('customChat',(fileName)=>{
        fs.readFile(__dirname + '/savedChats' + '/'+ socket.username + '/' + fileName ,'utf8',(err,data)=>{
            if(err){
                if(err.code = 'ENOENT'){
                    socket.emit("error")
                }
            }
            if(data == "") return;
            socket.emit('loadChatC',data)
        })
    })
    socket.on('deleteFile',(fileName)=>{
        con.query('DELETE FROM users.savedchats WHERE fileName=' + mysql.escape(fileName) +' AND ownerId=' + mysql.escape(ID),(err)=>{
            if(err) throw err
        })
    })
    
})

