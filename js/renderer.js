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
	    this.camera = new THREE.PerspectiveCamera(60, width/height, 0.01, 10000);
	    this.renderer = new THREE.WebGLRenderer();
	    this.renderer.setSize(width, height);
	    this.renderer.autoClear = false;
	    document.body.appendChild(this.renderer.domElement);

	    this.textures = {}
	    this.loadTextures();

	    this.scene.add(new THREE.DirectionalLight(0xffffff, 1));
	    this.scene.add(new THREE.AmbientLight(0x222222));

	    this.renderSkybox();
	}

	initHUD() {
		const width = window.innerWidth;
	    const height = window.innerHeight;

		this.hudCanvas = document.createElement('canvas');
	    this.hudCanvas.width = width;
	    this.hudCanvas.height = height;

	    this.hudContext = this.hudCanvas.getContext('2d');

	    this.cameraHUD = new THREE.OrthographicCamera(-width/2, width/2, height/2, -height/2, 0, 30);
	    this.sceneHUD = new THREE.Scene();

	    this.hudTexture = new THREE.Texture(this.hudCanvas);
	    const material = new THREE.MeshBasicMaterial( {map: this.hudTexture } );
	    material.transparent = true;

	    var planeGeometry = new THREE.PlaneGeometry( width, height );
	    var plane = new THREE.Mesh(planeGeometry, material);
	    this.sceneHUD.add(plane);

	    this.crosshair = new THREE.Vector2(0, 0);
	}

	renderSkybox() {
	    const geometry = new THREE.CubeGeometry(10000, 10000, 10000);
	    const material = new THREE.MeshBasicMaterial({map: this.textures['space'] })
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
				let pos = this.parseVector(ship.pos);
				let vel = this.parseVector(ship.vel);
				let rotateVel = this.parseVector(ship.rotateVel);
				let quaternion = this.parseQuaternion(ship.quaternion);

				this.myShip = new Ship(pos, vel, rotateVel, quaternion);
			}
			else {
				this.newShip(shipId, ship);
			} 
		}
	}

	start(data) {
		this.playerId = data.playerId;

		this.initAsteroids(data['asteroids']);
		this.initBullets(data['bullets']);
		this.initShips(data['ships']);

		this.lastTime = 0;
		this.renderLoop(0);
	}

	newAsteroid(asteroidId, asteroidData) {
		let pos = this.parseVector(asteroidData.pos);
		let vel = this.parseVector(asteroidData.vel);
		let axis = this.parseVector(asteroidData.axis);

		let asteroid = new Asteroid(pos, asteroidData.r, vel, axis, asteroidData.angle)

		let r = asteroid.r;
		let geometry = new THREE.IcosahedronGeometry(r,1);
		
		for (var i = 0; i < geometry.vertices.length; i++) {
			geometry.vertices[i].x += (r/3)*Math.random() - (r/6);
			geometry.vertices[i].y += (r/3)*Math.random() - (r/6);
			geometry.vertices[i].z += (r/3)*Math.random() - (r/6);
		}
		asteroid.mesh = new THREE.Mesh(geometry, new THREE.MeshLambertMaterial({map: this.textures['asteroid']}));
		asteroid.mesh.position.copy(asteroid.pos);
		this.scene.add(asteroid.mesh);

		this.asteroids[asteroidId] = asteroid;
	}

	newBullet(bulletId, bulletData) {
		let pos = this.parseVector(bulletData.pos);
		let vel = this.parseVector(bulletData.vel);
		let bullet = new Bullet(bulletData.playerId, pos, vel);

		const geometry = new THREE.SphereGeometry(0.2)
		const material = new THREE.MeshBasicMaterial({color: 0xcccc00})

		bullet.mesh = new THREE.Mesh(geometry, material);
		bullet.mesh.position.copy(bullet.pos);
		this.scene.add(bullet.mesh);

		this.bullets[bulletId] = bullet;
	}

	newShip(shipId, shipData) {
		let pos = this.parseVector(shipData.pos);
		let vel = this.parseVector(shipData.vel);
		let rotateVel = this.parseVector(shipData.rotateVel);
		let quaternion = this.parseQuaternion(shipData.quaternion);

		let ship = new Ship(pos, vel, rotateVel, quaternion);
		ship.keysPressed = shipData.keysPressed;

		const geometry = new THREE.TetrahedronGeometry(3);
		const material = new THREE.MeshLambertMaterial({color: 0x00ff00});

		ship.mesh = new THREE.Mesh(geometry, material);
		ship.mesh.position.copy(ship.pos);
		this.scene.add(ship.mesh);

		this.ships[shipId] = ship;
	}

	updateAsteroids(asteroids) {
		for (const [asteroidId, asteroid] of Object.entries(asteroids)) {
			if (this.asteroids.hasOwnProperty(asteroidId)) {
				let pos = this.parseVector(asteroid.pos);

				this.asteroids[asteroidId].pos.copy(pos);
				this.asteroids[asteroidId].mesh.position.copy(pos);
			} else {
				this.newAsteroid(asteroidId, asteroid);
			}
		}
	}

	updateBullets(bullets) {
		for (const [bulletId, bullet] of Object.entries(this.bullets)) {
			if(bullets.hasOwnProperty(bulletId)) {
				let pos = this.parseVector(bullets[bulletId].pos);
				let lifetime = bullets[bulletId].lifetime;

				this.bullets[bulletId].lifetime = lifetime;
				this.bullets[bulletId].pos.copy(pos);
				this.bullets[bulletId].mesh.position.copy(pos);
				delete bullets[bulletId];
			} else {
				this.scene.remove(this.bullets[bulletId].mesh);
				delete this.bullets[bulletId];
			}
		}

		for (const [bulletId, bullet] of Object.entries(bullets)) {
			this.newBullet(bulletId, bullet);
		}
	}

	updateShips(ships) {
		for (const [shipId, ship] of Object.entries(ships)) {
			let pos = this.parseVector(ship.pos);
			let vel = this.parseVector(ship.vel);
			let rotateVel = this.parseVector(ship.rotateVel);
			let quaternion = this.parseQuaternion(ship.quaternion);

			if (shipId == this.playerId) {
				this.myShip.pos.copy(pos);
				this.myShip.vel.copy(vel);
				this.myShip.rotateVel.copy(rotateVel);
				this.myShip.quaternion.copy(quaternion);
				this.myShip.keysPressed = ship.keysPressed;
			} else if (this.ships.hasOwnProperty(shipId)) {
				this.ships[shipId].pos.copy(pos);
				this.ships[shipId].vel.copy(vel);
				this.ships[shipId].rotateVel.copy(rotateVel);
				this.ships[shipId].quaternion.copy(quaternion);
				this.ships[shipId].keysPressed = ship.keysPressed;

				this.ships[shipId].mesh.setRotationFromQuaternion(this.ships[shipId].quaternion);
				this.ships[shipId].mesh.position.copy(pos);
			} else {
				this.newShip(shipId, ship);
			}
		}
	}

	parseVector(vector) {
		return new THREE.Vector3(vector.x, vector.y, vector.z);
	}

	parseQuaternion(quaternion) {
		return new THREE.Quaternion(quaternion._x, quaternion._y, quaternion._z, quaternion._w);
	}


	update(data) {
		//this.updateAsteroids(data['asteroids']);
		this.updateBullets(data['bullets']);
		this.updateShips(data['ships']);
	}

	mouseMove() {
		const mouseMoveVector = new THREE.Vector2(event.movementX, event.movementY);
	    this.crosshair.add(mouseMoveVector);
	    if (this.crosshair.length() > 100) {
	      this.crosshair.normalize().multiplyScalar(100);
	    }
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
	    this.hudContext.fillStyle = 'red';
	    
	    this.hudContext.beginPath();
	    this.hudContext.arc(window.innerWidth/2+this.crosshair.x, window.innerHeight/2+this.crosshair.y, 3, 0, 2 * Math.PI);
	    this.hudContext.fill();
	    this.hudContext.closePath();

	    this.hudContext.strokeStyle = 'green';
	    this.hudContext.lineWidth = 2;

	    this.hudContext.beginPath();
	    this.hudContext.arc(window.innerWidth/2, window.innerHeight/2, 100, 0, 2 * Math.PI);
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
		return "{"+vector.x.toFixed(2)+", "+vector.y.toFixed(2)+", "+vector.z.toFixed(2)+"}";
	}

	quaternionToString(quaternion) {
		return "{"+quaternion._x.toFixed(2)+", "+quaternion._y.toFixed(2)+", "+quaternion._z.toFixed(2)+", "+quaternion._w.toFixed(2)+"}";
	}

	renderHUD() {
		this.hudContext.clearRect(0, 0, window.innerWidth, window.innerHeight);
	    this.renderCrosshair();
	    this.hudTexture.needsUpdate = true;

	    this.hudContext.font = "16px Arial";
	    this.hudContext.fillStyle = "white";
	    this.hudContext.textAlign = "start";
	    this.hudContext.textBaseline = "bottom";

	    // this.hudContext.fillText("FPS: " + Math.round(this.fps), 5, this.hudCanvas.height - 85); 
	    this.hudContext.fillText("Postition: " + this.vectorToString(this.myShip.pos), 5, this.hudCanvas.height - 65); 
	    this.hudContext.fillText("Velocity: " + this.vectorToString(this.myShip.vel), 5, this.hudCanvas.height - 45); 
	    this.hudContext.fillText("Rotation Velocity: " + this.vectorToString(this.myShip.rotateVel), 5, this.hudCanvas.height - 25); 
	    this.hudContext.fillText("Orientation: " + this.quaternionToString(this.myShip.quaternion), 5, this.hudCanvas.height - 5); 

	    this.renderer.render(this.sceneHUD, this.cameraHUD);
	}

	renderLoop(ts) {
	    requestAnimationFrame((timestamp) => this.renderLoop(timestamp));
	    const dt = (ts - this.lastTime)/1000;
	    this.lastTime = ts;

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
			ship.mesh.setRotationFromQuaternion(ship.quaternion);
			ship.mesh.position.copy(ship.pos);
        }

        this.myShip.update(dt);

	    this.render3D();
	    this.renderHUD();
	  }
}

module.exports = Renderer;
