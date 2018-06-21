const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io').listen(server);

app.use('/dist', express.static(__dirname + '/dist'));
app.use('/images', express.static(__dirname + '/images'));

app.get('/', function(req, res) {
    res.sendFile(__dirname + '/index.html');
});

const port = process.env.PORT || 80;

server.listen(port, function() {
    console.log('Web Server listening on port ' + port);
});