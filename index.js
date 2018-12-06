const bodyParser = require("body-parser")
const mysql = require("mysql")
const fs = require('fs');
const express = require("express")
const app = express()
const server = require("http").Server(app)
var nodemailer = require('nodemailer');
const serverPort = 80
const Cryptr = require('cryptr');
const cryptr = new Cryptr('myTotalySecretKey');
var users
var userName
var files
app.set('views', __dirname + '/views');
app.engine('html', require('ejs').renderFile);

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

//Signup Page
app.get('/signup',(req,res)=>{
    res.render(__dirname +"/public/views/signup.html")
})
app.get('/styles/signup_style.css',(req,res)=>{
    res.sendFile(__dirname +"/public/styles/signup_style.css")
})

//Chat Page Resourses
app.get('/styles/chat_style.css',(req,res)=>{
    res.sendFile(__dirname +"/public/styles/chat_style.css")
})

app.get('/codes/chat.js',(req,res)=>{
    res.sendFile(__dirname + "/public/codes/chat.js")
})

app.get('/styles/admin_style.css',(req,res)=>{
    res.sendFile(__dirname +"/public/styles/admin_style.css")
})
app.get('/codes/admin.js',(req,res)=>{
    res.sendFile(__dirname + "/public/codes/admin.js")
})
app.post('/home',(req,res)=>{
    userName = req.body.userName
    let userPassword = req.body.userPass
    con.query('SELECT * FROM users.userData WHERE userName = ' + mysql.escape(userName) +' AND isActive = 1',(err,result,fields)=>{
        if(err) throw err
        if(result.length > 0){
            ID = result[0].id
            if(result[0].userName == userName && cryptr.decrypt(result[0].userPassword)  == userPassword){
                if(result[0].userType == "user"){
                    res.render(__dirname + '/public/views/chat.html')
                    con.query("SELECT fileName FROM users.savedchats WHERE ownerUsername=" + mysql.escape(userName) + " AND fileName <> 'autosave.html'",(err,result,fields)=>{
                        if(err) throw err
                        files = result
                    })
                }else{
                    res.render(__dirname + '/public/views/admin.html')
                    con.query("SELECT userName, userPassword FROM users.userdata WHERE userName <> 'admin' ",(err,result,fields)=>{
                    if(err) throw err
                    users = result;
                    })
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
    let newUserPassword = cryptr.encrypt(req.body.newUserPass) 
    let newEmail = req.body.newEmail
    let userType = "user"
    console.log(newUserPassword)
    console.log(newEmail)
    con.query('SELECT * FROM users.userData WHERE email = ' + mysql.escape(newEmail),(err,result,fields)=>{
        if(err) throw err
        if(result.length > 0){
            res.write('Already Exist a User with this email')
            res.end()
        }else{
            let isActive = "0"
            con.query('INSERT INTO users.userData (email,isActive,userType,userName,userPassword) VALUES (' + mysql.escape(newEmail) + ',' + mysql.escape(isActive) + ',' + mysql.escape(userType) + ','+ mysql.escape(newUserName) + ',' + mysql.escape(newUserPassword) +')',(err,result,fields)=>{
                if(err) throw err
                fs.mkdir(__dirname + '/savedChats/' + newUserName,(err)=>{
                    if(err) console.log(err);
                    let url = "<a href='localhost/v/" + cryptr.encrypt(newEmail) + "'>Verify Account!</a>" 
                    var transporter = nodemailer.createTransport({
                        service: 'gmail',
                        auth: {
                          user: 'santiago10.jbch@gmail.com',
                          pass: 'Teclado12M.'
                        }
                      });
                    var mailOptions = {
                        from: 'santiago10.jbch@gmail.com',
                        to: newEmail,
                        subject: 'Confirm your acout --No reply--',
                        html: url
                    };
                    transporter.sendMail(mailOptions, function(error, info){
                        if (error) {
                          console.log(error);
                        } else {
                          console.log('Email sent: ' + info.response);
                        }
                      });
                    res.redirect('/')
                })
            })
        }
        
    })
    
})

app.get('/v/:email',(req,res)=>{
    email = cryptr.decrypt(req.params.email) 
    con.query('SELECT * FROM users.userdata WHERE email =' +  mysql.escape(email) +' AND isActive = 0',(err,result)=>{
        if(err) console.log(err)
        if(result.length > 0){
            con.query('UPDATE users.userData SET isActive = 1 WHERE email=' + mysql.escape(email),(err)=>{
                if(err) console.log(err)
               
            })
            res.write("Account Succesfully Verified!")
            res.end()
        }else{
            res.write("Cant reach this page")
            res.end()
        }
    })
    
})
io.on('connection',(socket)=>{
    socket.username = userName;
    con.query("SELECT fileName FROM users.savedchats WHERE ownerUsername=" + mysql.escape(socket.username) + " AND fileName <> 'autosave.html'",(err,result,fields)=>{
        if(err) throw err
        files = result
    })
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
            if(err) console.log(err);
            con.query('SELECT * FROM users.savedchats WHERE fileName=' + mysql.escape(fileName) + 'AND ownerUsername=' + mysql.escape(socket.username),(err,res,fields)=>{
                if(err) throw err
                if(res <= 0){
                    con.query('INSERT INTO users.savedchats (ownerUsername,fileName) VALUES(' + mysql.escape(socket.username) + ',' + mysql.escape(fileName) + ')', (err)=>{
                        if(err) throw err;
                        con.query("SELECT * FROM users.savedchats WHERE fileName <> 'autosave.html' AND ownerUsername=" + mysql.escape(socket.username),(err,res,fields)=>{
                            if(err) throw err
                            if(res > 0) files = res
                        })
                        socket.emit('fileTable',files)
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
        console.log(socket.username)
        con.query("SELECT * FROM users.savedchats WHERE fileName <> 'autosave.html' AND ownerUsername=" + mysql.escape(socket.username),(err,res,fields)=>{
            if(err) throw err
            if(res > 0) files = res
        })
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
        con.query('DELETE FROM users.savedchats WHERE fileName=' + mysql.escape(fileName) +' AND ownerUsername=' + mysql.escape(socket.username),(err)=>{
            if(err) throw err
            con.query("SELECT * FROM users.savedchats WHERE fileName <> 'autosave.html' AND ownerUsername=" + mysql.escape(socket.username),(err,res,fields)=>{
                if(err) throw err
                if(res > 0) files = res
            })
            socket.emit('fileTable',files)
        })

    })
    socket.on('newUser',(newUserName,newUserPassword)=>{
        let userType = "user"
        con.query('INSERT INTO users.userData (userType,userName,userPassword) VALUES (' + mysql.escape(userType) + ','+ mysql.escape(newUserName) + ',' + mysql.escape(newUserPassword) +')',(err,result,fields)=>{
            if(err) throw err
    
        })
        fs.mkdir(__dirname + '/savedChats/' + newUserName,(err)=>{
            if(err) throw err;
        })
    })
})

