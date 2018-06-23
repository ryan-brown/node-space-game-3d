const THREE = require('three');
const Ship = require('./ship.js');
const Bullet = require('./bullet.js');
const Asteroid = require('./asteroid.js');

class Renderer {
    constructor() {
        this.ships = {};
        this.bullets = {};
        this.asteroids = {};

        this.initScene();
        this.initHUD();
    }

    initScene() {
        const width = window.innerWidth;
        const height = window.innerHeight;

        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(60, width / height, 0.25, 5000);
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

        this.crosshair = new THREE.Vector2(0, 0);
        this.lastDts = [0,0,0,0,0,0,0,0,0,0];
    }

    renderWireSphere() {
        const geometry = new THREE.SphereGeometry(2500, 32, 32);
        const material = new THREE.MeshBasicMaterial({
          color: 0x00ffff,
          wireframe: true
        });
        const mesh = new THREE.Mesh(geometry, material);
        this.scene.add(mesh);
    }

    renderSkybox() {
        const geometry = new THREE.CubeGeometry(10000, 10000, 10000);
        const material = new THREE.MeshBasicMaterial({
            map: this.textures['space']
        })
        this.skybox = new THREE.Mesh(geometry, material);
        this.skybox.material.side = THREE.BackSide;

        this.scene.add(this.skybox);
    }

    loadTextures() {
        const loader = new THREE.TextureLoader();
        this.textures['asteroid'] = loader.load('images/rock-texture.jpg');
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

        this.lastTime = 0;
        this.renderLoop(0);
    }

    newAsteroid(asteroidId, asteroidData) {
        //console.log(asteroidData);
        let asteroid = Asteroid.deserialize(asteroidData);
        console.log(asteroid);

        let r = asteroid.r;
        let geometry = new THREE.OctahedronGeometry(r, 1);

        for (var i = 0; i < geometry.vertices.length; i++) {
            geometry.vertices[i].x += (r / 3) * Math.random() - (r / 6);
            geometry.vertices[i].y += (r / 3) * Math.random() - (r / 6);
            geometry.vertices[i].z += (r / 3) * Math.random() - (r / 6);
        }

        //const material = new THREE.MeshLambertMaterial({ map: this.textures['asteroid'] });
        const material = new THREE.MeshBasicMaterial({ color: 0xff00ff, wireframe: true });

        asteroid.mesh = new THREE.Mesh(geometry, material);
        asteroid.mesh.position.copy(asteroid.pos);
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
        bullet.mesh.position.copy(bullet.pos);
        this.scene.add(bullet.mesh);

        this.bullets[bulletId] = bullet;
    }

    newShip(shipId, shipData) {
        let ship = Ship.deserialize(shipData);

        const geometry = new THREE.ConeGeometry(10, 20, 8);
        const material = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            wireframe: true
        });

        ship.mesh = new THREE.Mesh(geometry, material);
        ship.mesh.position.copy(ship.pos);
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

                this.ships[shipId].mesh.position.copy(ship.pos);

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

    mouseMove(event) {
        const mouseMoveVector = new THREE.Vector2(event.movementX, event.movementY);
        this.crosshair.add(mouseMoveVector);

        const maxHeight = this.hudCanvas.height / 10;

        if (this.crosshair.length() > maxHeight) this.crosshair.normalize().multiplyScalar(maxHeight);
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

    renderCrosshair() {
        const width = window.innerWidth;
        const height = window.innerHeight;

        this.hudContext.fillStyle = 'red';

        this.hudContext.beginPath();
        this.hudContext.arc(width / 2 + this.crosshair.x, height / 2 + this.crosshair.y, 3, 0, 2 * Math.PI);
        this.hudContext.fill();
        this.hudContext.closePath();

        this.hudContext.strokeStyle = 'green';
        this.hudContext.lineWidth = 2;

        this.hudContext.beginPath();
        this.hudContext.arc(width / 2, height / 2, height / 6, 0, 2 * Math.PI);
        this.hudContext.stroke();
        this.hudContext.closePath();
    }

    render3D() {
        let q = this.myShip.quaternion;
        this.camera.setRotationFromQuaternion(new THREE.Quaternion(q._x, q._y, q._z, q._w));

        this.camera.position.x = this.myShip.pos.x;
        this.camera.position.y = this.myShip.pos.y;
        this.camera.position.z = this.myShip.pos.z;

        this.skybox.position.x = this.myShip.pos.x;
        this.skybox.position.y = this.myShip.pos.y;
        this.skybox.position.z = this.myShip.pos.z;

        this.renderer.render(this.scene, this.camera);
    }

    vectorToString(vector) {
        return "{" + vector.x.toFixed(2) + ", " + vector.y.toFixed(2) + ", " + vector.z.toFixed(2) + "}";
    }

    quaternionToString(quaternion) {
        return "{" + quaternion._x.toFixed(2) + ", " + quaternion._y.toFixed(2) + ", " + quaternion._z.toFixed(2) + ", " + quaternion._w.toFixed(2) + "}";
    }

    renderScoreboard() {
        this.hudContext.textBaseline = "top";

        this.hudContext.fillText("Scoreboard", 5, 5);
        this.hudContext.fillText(this.playerId + "(you): " + Math.round(this.myShip.score), 5, 25);

        let currentHeight = 45;
        for (const [shipId, ship] of Object.entries(this.ships)) {
            this.hudContext.fillText(shipId + ": " + Math.round(ship.score), 5, currentHeight);
            currentHeight += 20;
        }
    }

    renderDebug(fps) {
        this.hudContext.textBaseline = "bottom";

        const height = this.hudCanvas.height;

        this.hudContext.fillText("FPS: " + Math.round(fps), 5, height - 85);
        this.hudContext.fillText("Postition: " + this.vectorToString(this.myShip.pos), 5, height - 65);
        this.hudContext.fillText("Velocity: " + this.vectorToString(this.myShip.vel), 5, height - 45);
        this.hudContext.fillText("Rotation Velocity: " + this.vectorToString(this.myShip.rotateVel), 5, height - 25);
        this.hudContext.fillText("Orientation: " + this.quaternionToString(this.myShip.quaternion), 5, height - 5);
    }

    renderHUD(fps) {
        this.hudContext.clearRect(0, 0, this.hudCanvas.width, this.hudCanvas.height);
        this.renderCrosshair();
        this.hudTexture.needsUpdate = true;

        this.hudContext.font = "16px Arial";
        this.hudContext.fillStyle = "white";
        this.hudContext.textAlign = "start";

        this.renderScoreboard();
        this.renderDebug(fps);

        this.renderer.render(this.sceneHUD, this.cameraHUD);
    }

    renderLoop(ts) {
        requestAnimationFrame((timestamp) => this.renderLoop(timestamp));
        const dt = (ts - this.lastTime) / 1000;
        this.lastTime = ts;
        this.lastDts.shift();
        this.lastDts.push(dt);
        let fps = this.lastDts.length / this.lastDts.reduce((sum, dt) => sum + dt);

        for (const [asteroidId, asteroid] of Object.entries(this.asteroids)) {
            asteroid.update(dt);
            asteroid.mesh.position.copy(asteroid.pos);
        }

        for (const [bulletId, bullet] of Object.entries(this.bullets)) {
            bullet.update(dt);
            bullet.mesh.position.copy(bullet.pos);
        }

        for (const [playerId, ship] of Object.entries(this.ships)) {
            ship.update(dt);

            let currentQuaternion = ship.quaternion.clone();
            currentQuaternion.multiplyQuaternions(currentQuaternion, (new THREE.Quaternion(-1,0,0,1)).normalize());
            this.ships[playerId].mesh.setRotationFromQuaternion(currentQuaternion);

            ship.mesh.position.copy(ship.pos);
        }

        this.myShip.update(dt);

        this.render3D();
        this.renderHUD(fps);
    }
}

module.exports = Renderer;