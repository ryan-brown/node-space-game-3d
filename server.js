var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io').listen(server);

var Engine = require('./js/engine.js');

app.use('/dist',express.static(__dirname + '/dist'));
app.use('/images',express.static(__dirname + '/images'));

app.get('/',function(req,res){
    res.sendFile(__dirname+'/index.html');
});

server.listen(8090, function() {
    console.log('Listening on '+server.address().port);
});

let engine = new Engine();

io.on('connection', function(socket) {
    console.log('user connected');
    engine.addShip(socket.id);
    socket.emit('init', { 
        playerId: socket.id,
        ships: engine.ships,
        asteroids: engine.asteroids,
        bullets: engine.bullets
    });

    socket.on('keyup', function(data) {
        console.log('user keyup');
        engine.ships[socket.id].keysPressed[data] = false;
    });

    socket.on('keydown', function(data) {
        console.log('user keydown');
        engine.ships[socket.id].keysPressed[data] = true;
    });

    socket.on('fire', function() {
        console.log('user fired');
        engine.fire(socket.id);
    });

    socket.on('disconnect', function(){
        console.log('user disconnected');
        engine.removeShip(socket.id);
    });  
});

let ENGINE_FPS = 50;
let lastTime = new Date().getTime();
setInterval(function () {
    const now = new Date().getTime();
    const dt = (now - lastTime) / 1000;
    lastTime = now;

    engine.update(dt);

    io.sockets.emit('update', { 
        "ships": engine.ships,
        //"asteroids": engine.asteroids,
        "bullets": engine.bullets
    });
}, 1000 / ENGINE_FPS);

