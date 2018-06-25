let startButton = document.getElementById("startButton");
let usernameField = document.getElementById("usernameField");
let hueField = document.getElementById("hueField");
let loginDiv = document.getElementById("loginDiv");
startButton.addEventListener("click", () => {
    loginDiv.style.display = "none";

    const username = usernameField.value || "Untitled";
    let hue = parseInt(hueField.value) || 0;
    if (hue > 360) hue = 360;
    if (hue < 0) hue = 0;

    const Renderer = require('./renderer.js');
    const config = require('./config.js');

    const socket = io.connect("localhost:8090");
    socket.emit("start", {
        username: username,
        hue: hue
    });

    socket.on("init", (data) => {
        let keysPressed = {};
        let renderer = new Renderer(config);

        renderer.start(data);

        addEventListener("resize", () => renderer.resizeWindow());

        addEventListener("click", function() {
            const element = document.body;
            element.requestPointerLock = element.requestPointerLock ||
                element.mozRequestPointerLock ||
                element.webkitRequestPointerLock;
            element.requestPointerLock();
        });

        addEventListener("mousemove", (event) => renderer.mouseMove(event));

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

    });
});