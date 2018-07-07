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

    let validatedData = engine.validateData(data);
    if (validatedData) {
      engine.addShip(socket.id, validatedData);
      socket.emit('init', engine.serialize(socket.id));
    } else {
      socket.emit('invalid');
      socket.disconnect();
    }

    socket.on('keyup', function(data) {
      engine.ships[socket.id].keysPressed = engine.ships[socket.id].keysPressed.filter(x => x != data);
    });

    socket.on('keydown', function(data) {
      engine.ships[socket.id].keysPressed.push(data);
      if (data == 80) engine.ships[socket.id].overrideFire = true;
    });

    socket.on('disconnect', function() {
      console.log('user disconnected');
      engine.removeShip(socket.id);
    });
  });
});

const NS_PER_SEC = 1e9;
const EMITS_PER_SECOND = 30;
let timeTilEmit = 0;
let lastTime = process.hrtime();
setInterval(() => {
  const currTime = process.hrtime();
  const dt = currTime[0]-lastTime[0] + (currTime[1]-lastTime[1])/NS_PER_SEC;
  lastTime = currTime;

  engine.update(dt);

  timeTilEmit -= dt;
  if (timeTilEmit <= 0) {
    timeTilEmit = 1/EMITS_PER_SECOND;

    io.sockets.emit('update', engine.updateSerialize());

    engine.newBullets = [];
    engine.removedBullets = [];
    engine.newAsteroids = [];
    engine.updateAsteroids = [];
    engine.removedAsteroids = [];
  }
});
