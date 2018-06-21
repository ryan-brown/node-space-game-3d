var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io').listen(server);

var Engine = require('./js/engine.js');

app.use('/dist', express.static(__dirname + '/dist'));
app.use('/images', express.static(__dirname + '/images'));

app.get('/', function(req, res) {
    res.sendFile(__dirname + '/index.html');
});

server.listen(8090, function() {
    console.log('Listening on ' + server.address().port);
});

let engine = new Engine();

io.on('connection', function(socket) {
    console.log('user connected');
    engine.addShip(socket.id);
    socket.emit('init', engine.serialize(socket.id));

    socket.on('keyup', function(data) {
        engine.ships[socket.id].keysPressed = engine.ships[socket.id].keysPressed.filter(x => x != data);
    });

    socket.on('keydown', function(data) {
        engine.ships[socket.id].keysPressed.push(data);
    });

    socket.on('fire', function() {
        engine.fire(socket.id);
    });

    socket.on('disconnect', function() {
        console.log('user disconnected');
        engine.removeShip(socket.id);
    });
});

let ENGINE_FPS = 50;
let lastTime = new Date().getTime();
setInterval(function() {
    const now = new Date().getTime();
    const dt = (now - lastTime) / 1000;
    lastTime = now;

    engine.update(dt);

    io.sockets.emit('update', engine.updateSerialize());

    engine.newBullets = [];
    engine.removedBullets = [];
}, 1000 / ENGINE_FPS);
