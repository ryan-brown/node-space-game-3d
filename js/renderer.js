const THREE = require('three');
const Ship = require('./ship.js');
const Bullet = require('./bullet.js');
const Asteroid = require('./asteroid.js');
const Explosion = require('./explosion.js');

class Renderer {
  constructor(config) {
    this.config = config;
    this.ships = {};
    this.bullets = {};
    this.asteroids = {};
    this.explosions = [];

    this.initScene();
    this.initHUD();
  }

  initScene() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(60, width / height, 0.25, 2*this.config["mapRadius"]);
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setSize(width, height);
    this.renderer.autoClear = false;
    document.body.appendChild(this.renderer.domElement);

    this.textures = {}
    this.loadTextures();

    this.renderWireSphere();
    this.renderSkybox();
  }

  initHUD() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.hudCanvas = document.createElement('canvas');
    this.hudCanvas.width = width;
    this.hudCanvas.height = height;

    this.hudContext = this.hudCanvas.getContext('2d');

    this.cameraHUD = new THREE.OrthographicCamera(-width / 2, width / 2, height / 2, -height / 2, 0, 30);
    this.sceneHUD = new THREE.Scene();

    this.hudTexture = new THREE.Texture(this.hudCanvas);
    const material = new THREE.MeshBasicMaterial({
      map: this.hudTexture
    });
    material.transparent = true;

    var planeGeometry = new THREE.PlaneGeometry(width, height);
    var plane = new THREE.Mesh(planeGeometry, material);
    this.sceneHUD.add(plane);

    this.lastDts = [0,0,0,0,0,0,0,0,0,0];
  }

  renderWireSphere() {
    const geometry = new THREE.SphereGeometry(this.config["mapRadius"], 32, 32);
    const material = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      wireframe: true
    });
    const mesh = new THREE.Mesh(geometry, material);
    this.scene.add(mesh);
  }

  renderSkybox() {
    const geometry = new THREE.SphereGeometry(2*this.config["mapRadius"], 32, 32);
    const material = new THREE.MeshBasicMaterial({
      map: this.textures['space']
    })
    this.skybox = new THREE.Mesh(geometry, material);
    this.skybox.material.side = THREE.BackSide;

    this.scene.add(this.skybox);
  }

  loadTextures() {
      const loader = new THREE.TextureLoader();
      this.textures['space'] = loader.load('images/space-texture.jpg');
  }

  initAsteroids(asteroids) {
    for (const [asteroidId, asteroid] of Object.entries(asteroids)) {
      this.newAsteroid(asteroidId, asteroid);
    }
  }

  initBullets(bullets) {
    for (const [bulletId, bullet] of Object.entries(bullets)) {
      this.newBullet(bulletId, bullet);
    }
  }

  initShips(ships) {
    for (const [shipId, ship] of Object.entries(ships)) {
      if (shipId == this.playerId) {
        this.myShip = Ship.deserialize(ship);
      } else {
        this.newShip(shipId, ship);
      }
    }
  }

  start(data) {
    this.playerId = data[0];

    this.initAsteroids(data[1]);
    this.initBullets(data[2]);
    this.initShips(data[3]);

    requestAnimationFrame((ts) => this.renderLoop(ts));
  }

  newAsteroid(asteroidId, asteroidData) {
    let asteroid = Asteroid.deserialize(asteroidData);
    let radius = asteroid.radius;
    let geometry = new THREE.IcosahedronGeometry(radius);

    for (var i = 0; i < geometry.vertices.length; i++) {
      geometry.vertices[i].x += (radius / 3) * Math.random() - (radius / 6);
      geometry.vertices[i].y += (radius / 3) * Math.random() - (radius / 6);
      geometry.vertices[i].z += (radius / 3) * Math.random() - (radius / 6);
    }

    const material = new THREE.MeshBasicMaterial({ color: 0xff00ff, wireframe: true });

    asteroid.mesh = new THREE.Mesh(geometry, material);
    asteroid.mesh.position.copy(asteroid.position);
    this.scene.add(asteroid.mesh);

    this.asteroids[asteroidId] = asteroid;
  }

  newBullet(bulletId, bulletData) {
    let bullet = Bullet.deserialize(bulletData);

    const geometry = new THREE.TetrahedronGeometry(0.1)
    const material = new THREE.MeshBasicMaterial({
      color: 0xffff00,
      wireframe: true
    });

    bullet.mesh = new THREE.Mesh(geometry, material);
    bullet.mesh.position.copy(bullet.position);
    this.scene.add(bullet.mesh);

    this.bullets[bulletId] = bullet;
  }

  newShip(shipId, shipData) {
    let ship = Ship.deserialize(shipData);

    const geometry = new THREE.ConeGeometry(10, 20, 8);
    const material = new THREE.MeshBasicMaterial({
      color: `hsl(${ship.hue}, 100%, 50%)`,
      wireframe: true
    });

    ship.mesh = new THREE.Mesh(geometry, material);
    ship.mesh.position.copy(ship.position);
    this.scene.add(ship.mesh);

    this.ships[shipId] = ship;
  }

  updateAsteroids(data) {
    for (const [asteroidId, asteroidData] of Object.entries(data)) {
      let newAsteroid = Asteroid.deserialize(asteroidData);
      newAsteroid.mesh = this.asteroids[asteroidId].mesh;
      this.asteroids[asteroidId] = newAsteroid;
    }
  }

  updateShips(ships) {
    this.myShip = Ship.deserialize(ships[this.playerId]);
    delete ships[this.playerId];

    for (const [shipId, ship] of Object.entries(this.ships)) {
      if (ships.hasOwnProperty(shipId)) {
        let newShip = Ship.deserialize(ships[shipId]);
        newShip.mesh = ship.mesh;
        this.ships[shipId] = newShip;

        let currentQuaternion = ship.quaternion.clone();
        currentQuaternion.multiplyQuaternions(currentQuaternion, (new THREE.Quaternion(-1,0,0,1)).normalize());
        this.ships[shipId].mesh.setRotationFromQuaternion(currentQuaternion);

        this.ships[shipId].mesh.position.copy(ship.position);

        delete ships[shipId];
      } else {
        this.scene.remove(ship.mesh);
        delete this.ships[shipId];
      }
    }

    for (const [shipId, shipData] of Object.entries(ships)) {
        this.newShip(shipId, shipData);
    }
  }

  update(data) {
    for (const [bulletId, bullet] of Object.entries(data[0])) {
      this.newBullet(bulletId, bullet);
    }

    for (const [asteroidId, asteroid] of Object.entries(data[1])) {
      this.newAsteroid(asteroidId, asteroid);
    }

    for (const bulletId of data[2]) {
      const explosion = new Explosion(this.bullets[bulletId].position);
      this.explosions.push(explosion)
      this.scene.add(explosion.mesh);

      this.scene.remove(this.bullets[bulletId].mesh);
      delete this.bullets[bulletId];
    }

    for (const asteroidId of data[3]) {
      this.scene.remove(this.asteroids[asteroidId].mesh);
      delete this.asteroids[asteroidId];
    }

    this.updateAsteroids(data[4]);

    this.updateShips(data[5]);
  }

  resizeWindow() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);

    this.hudCanvas.width = width;
    this.hudCanvas.height = height;
  }

  crosshairStroke(startX, startY, endX, endY) {
    this.hudContext.beginPath();
    this.hudContext.moveTo(startX, startY);
    this.hudContext.lineTo(endX, endY);
    this.hudContext.stroke();
    this.hudContext.closePath();
  }

  renderCrosshair() {
    const centerX = window.innerWidth/2;
    const centerY = window.innerHeight/2;

    const size = Math.min(centerX, centerY)/50;

    this.hudContext.strokeStyle = 'white';
    this.hudContext.lineWidth = 3;

    this.crosshairStroke(centerX + size, centerY, centerX + 4*size, centerY);
    this.crosshairStroke(centerX - size, centerY, centerX - 4*size, centerY);
    this.crosshairStroke(centerX, centerY + size, centerX, centerY + 4*size);
    this.crosshairStroke(centerX, centerY - size, centerX, centerY - 4*size);
  }

  render3D() {
    let q = this.myShip.quaternion;
    this.camera.setRotationFromQuaternion(new THREE.Quaternion(q._x, q._y, q._z, q._w));

    this.camera.position.x = this.myShip.position.x;
    this.camera.position.y = this.myShip.position.y;
    this.camera.position.z = this.myShip.position.z;

    this.skybox.position.x = this.myShip.position.x;
    this.skybox.position.y = this.myShip.position.y;
    this.skybox.position.z = this.myShip.position.z;

    this.renderer.render(this.scene, this.camera);
  }

  vectorToString(vector) {
    return "{" + vector.x.toFixed(2) + ", " + vector.y.toFixed(2) + ", " + vector.z.toFixed(2) + "}";
  }

  quaternionToString(quaternion) {
    return "{" + quaternion._x.toFixed(2) + ", " + quaternion._y.toFixed(2) + ", " + quaternion._z.toFixed(2) + ", " + quaternion._w.toFixed(2) + "}";
  }

  renderScoreboard() {
    this.hudContext.font = "32px Arial";
    this.hudContext.fillStyle = "white";
    this.hudContext.textAlign = "start";
    this.hudContext.textBaseline = "top";

    this.hudContext.fillText("Scoreboard", 10, 10);

    let currentHeight = 42;
    this.hudContext.fillStyle = `hsl(${this.myShip.hue}, 100%, 50%)`;
    this.hudContext.fillText(this.myShip.username + "(you): " + Math.round(this.myShip.score), 10, currentHeight);

    for (const [shipId, ship] of Object.entries(this.ships)) {
      currentHeight += 32;
      this.hudContext.fillStyle = `hsl(${ship.hue}, 100%, 50%)`;
      this.hudContext.fillText(ship.username + ": " + Math.round(ship.score), 10, currentHeight);
    }
  }

  renderDebug(fps) {
    this.hudContext.textBaseline = "bottom";

    const height = this.hudCanvas.height;

    this.hudContext.fillText("FPS: " + Math.round(fps), 5, height - 85);
    this.hudContext.fillText("Postition: " + this.vectorToString(this.myShip.position), 5, height - 65);
    this.hudContext.fillText("Velocity: " + this.vectorToString(this.myShip.velocity), 5, height - 45);
    this.hudContext.fillText("Rotation Velocity: " + this.vectorToString(this.myShip.rotateVelocity), 5, height - 25);
    this.hudContext.fillText("Orientation: " + this.quaternionToString(this.myShip.quaternion), 5, height - 5);
  }

  renderBars() {
    const w = this.hudCanvas.width;
    const h = this.hudCanvas.height;

    const barWidth = w/4;
    const barHeight = h/20;

    const barBorder = 2;

    const healthBarWidth = barWidth * this.myShip.health / this.myShip.maxHealth;
    const energyBarWidth = barWidth * this.myShip.energy / this.myShip.maxEnergy;

    this.hudContext.fillStyle = "white";
    this.hudContext.fillRect(w/2 - barWidth/2 - barBorder, h - 3*barHeight - barBorder, barWidth+2*barBorder, 2*barHeight+3*barBorder);

    this.hudContext.fillStyle = "red";
    this.hudContext.fillRect(w/2 - barWidth/2, h-3*barHeight, Math.round(healthBarWidth), barHeight);

    this.hudContext.fillStyle = "yellow";
    this.hudContext.fillRect(w/2 - barWidth/2, h-2*barHeight+barBorder, Math.round(energyBarWidth), barHeight);

    this.hudContext.font = "24px Arial";
    this.hudContext.fillStyle = "black";
    this.hudContext.textAlign = "center";
    this.hudContext.textBaseline = "middle";

    this.hudContext.fillText(`${Math.round(this.myShip.health)}/${Math.round(this.myShip.maxHealth)}`, w/2, h-2.5*barHeight);
    this.hudContext.fillText(`${Math.round(this.myShip.energy)}/${Math.round(this.myShip.maxEnergy)}`, w/2, h-1.5*barHeight+barBorder);
  }

  renderHUD(fps) {
    this.hudContext.clearRect(0, 0, this.hudCanvas.width, this.hudCanvas.height);
    this.renderCrosshair();
    this.hudTexture.needsUpdate = true;

    this.renderBars();
    this.renderScoreboard();
    //this.renderDebug(fps);

    this.renderer.render(this.sceneHUD, this.cameraHUD);
  }

  renderLoop(ts, lastTime = ts) {
    const dt = (ts - lastTime) / 1000;

    this.lastDts.shift();
    this.lastDts.push(dt);
    let fps = this.lastDts.length / this.lastDts.reduce((sum, dt) => sum + dt);

    for (const [asteroidId, asteroid] of Object.entries(this.asteroids)) {
      asteroid.update(dt);
      asteroid.mesh.position.copy(asteroid.position);
    }

    for (const [bulletId, bullet] of Object.entries(this.bullets)) {
      bullet.update(dt);
      bullet.mesh.position.copy(bullet.position);
    }

    for (const [playerId, ship] of Object.entries(this.ships)) {
      ship.update(dt);

      let currentQuaternion = ship.quaternion.clone();
      currentQuaternion.multiplyQuaternions(currentQuaternion, (new THREE.Quaternion(-1,0,0,1)).normalize());
      this.ships[playerId].mesh.setRotationFromQuaternion(currentQuaternion);

      ship.mesh.position.copy(ship.position);
    }

    let i = this.explosions.length;
    while (i--) {
      this.explosions[i].update(dt);
      if (this.explosions[i].lifetime < 0) {
        this.scene.remove(this.explosions[i].mesh);
        this.explosions.splice(i, 1);
      }
    }

    this.myShip.update(dt);

    this.render3D();
    this.renderHUD(fps);

    requestAnimationFrame((timestamp) => this.renderLoop(timestamp, ts));
  }
}

module.exports = Renderer;