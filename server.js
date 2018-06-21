const port = process.env.PORT || 8090;

var http = require('http').createServer().listen(port, function() {
    console.log('Game server listening on port ' + port);
});
var io = require('socket.io').listen(http);

var Engine = require('./js/engine.js');

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

let ENGINE_FPS = 64;
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
