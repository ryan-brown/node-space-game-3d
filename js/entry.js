document.getElementById("startButton").addEventListener("click", () => {
  document.getElementById("loginDiv").style.display = "none";

  const Renderer = require('./renderer.js');
  const config = require('./config.js');

  const socket = io.connect("10.4.0.51:8090");
  socket.emit("start", {
    username: document.getElementById("usernameField").value,
    hue: document.getElementById("hueField").value,
    maxVelocity: document.getElementById("maxVelocityField").value,
    acceleration: document.getElementById("accelerationField").value,
    maxRotateVelocity: document.getElementById("maxRotateVelocityField").value,
    rotateAcceleration: document.getElementById("rotateAccelerationField").value,
    maxHealth: document.getElementById("maxHealthField").value,
    passiveHealthRegen: document.getElementById("passiveHealthRegenField").value,
    activeHealthRegen: document.getElementById("activeHealthRegenField").value,
    maxEnergy: document.getElementById("maxEnergyField").value,
    energyRegen: document.getElementById("energyRegenField").value,
    fireRate: document.getElementById("fireRateField").value,
  });

  socket.on("invalid", () => {
    alert("Invalid ship, please try again.");
    window.location.reload(false);
  });

  socket.on("init", (data) => {
    let keysPressed = {};
    let renderer = new Renderer(config);

    renderer.start(data);

    addEventListener("resize", () => renderer.resizeWindow());

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
  });
});
