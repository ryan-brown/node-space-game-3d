const Renderer = require('./renderer.js');

const socket = io.connect("http://localhost:8090");

let keysPressed = {};
let renderer = new Renderer();

addEventListener("resize", () => renderer.resizeWindow());

addEventListener("click", function() {
  const element = document.body;
  element.requestPointerLock = element.requestPointerLock ||
                    element.mozRequestPointerLock ||
                    element.webkitRequestPointerLock;
  element.requestPointerLock();
});

addEventListener("mousemove", (event) => renderer.mouseMove(event), false);

socket.on("init", function(data) {
	console.log("Connected to server, player: " + data.playerId);
	renderer.start(data);
});

socket.on("update", function(data) {
	renderer.update(data);
});

addEventListener("keyup", (event) => {
	if (keysPressed[event.keyCode]) {
		socket.emit("keyup", event.keyCode);
		keysPressed[event.keyCode] = false;
	}
});

addEventListener("keydown", (event) => {
	if (!keysPressed[event.keyCode]) {
		socket.emit("keydown", event.keyCode);
		keysPressed[event.keyCode] = true;
	}
});

addEventListener("click", (event) => {
	socket.emit("fire");
});
