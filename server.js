const port = process.env.PORT || 8090;

var http = require('http').createServer().listen(port, function() {
    console.log('Game server listening on port ' + port);
});
var io = require('socket.io').listen(http);

var Engine = require('./js/engine.js');
var config = require('./js/config.js');

let engine = new Engine(config);

io.on('connection', function(socket) {
    socket.on('start', function(data) {
        console.log(`user ${data["username"]} connected`);
        engine.addShip(socket.id, data);
        
        socket.emit('init', engine.serialize(socket.id));

        socket.on('keyup', function(data) {
            engine.ships[socket.id].keysPressed = engine.ships[socket.id].keysPressed.filter(x => x != data);
        });

        socket.on('keydown', function(data) {
            engine.ships[socket.id].keysPressed.push(data);
        });

        socket.on('fire', function(data) {
            engine.fire(socket.id, data);
        });

        socket.on('disconnect', function() {
            console.log('user disconnected');
            engine.removeShip(socket.id);
        });
    });
});

let ENGINE_FPS = 64;
let lastTime = new Date().getTime();
// let fullAsteroidUpdatePeriod = 1000;
// let lastFullAsteroidUpdate = 0;
setInterval(function() {
    const now = new Date().getTime();
    const dt = (now - lastTime) / 1000;

    lastTime = now;

    engine.update(dt);

    io.sockets.emit('update', engine.updateSerialize());

    // lastFullAsteroidUpdate -= dt;
    // if (lastFullAsteroidUpdate <= 0) {
    //     lastFullAsteroidUpdate = fullAsteroidUpdatePeriod;
    //     io.sockets.emit('azt', engine.updateSerialize());
    // }

    engine.newBullets = [];
    engine.removedBullets = [];
    engine.newAsteroids = [];
    engine.updateAsteroids = [];
    engine.removedAsteroids = [];
}, 1000 / ENGINE_FPS);
