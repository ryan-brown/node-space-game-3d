const THREE = require('three');
const Ship = require('./ship.js');
const Bullet = require('./bullet.js');
const Asteroid = require('./asteroid.js');

class Engine {
	constructor() {
		this.ships = {};
		this.bullets = {};
        this.currentBulletId = 0;
	    this.asteroids = this.generateAsteroids(2000, 2000, 5, 50, 0.1, 10, Math.PI/4);
	}

	addShip(playerId) {
		this.ships[playerId] = new Ship(new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Quaternion());
    }

	removeShip(playerId) {
        delete this.ships[playerId];
        delete this.bullets[playerId];
	}

	generateAsteroids(n, maxDist, rMin, rMax, velMin, velMax, maxAngle) {
		let asteroids = {}
        let currentId = 0;
		for (let i = 0; i < n; i++) {
		  const randX = 2*maxDist*Math.random() - maxDist;
		  const randY = 2*maxDist*Math.random() - maxDist;
		  const randZ = 2*maxDist*Math.random() - maxDist;
		  const pos = new THREE.Vector3(randX, randY, randZ)

		  const r = (rMax - rMin)*Math.random() + rMin;

		  const randVelX = (velMax - velMin)*Math.random() - velMin;
		  const randVelY = (velMax - velMin)*Math.random() - velMin;
		  const randVelZ = (velMax - velMin)*Math.random() - velMin;
		  const vel = new THREE.Vector3(randVelX, randVelY, randVelZ)

		  const randAxisX = Math.random();
		  const randAxisY = Math.random();
		  const randAxisZ = Math.random();
		  const axis = (new THREE.Vector3(randVelX, randVelY, randVelZ)).normalize();

		  const angle = 2*maxAngle*Math.random() - maxAngle;

		  asteroids[currentId] = new Asteroid(pos, r, vel, axis, angle);
          currentId++;
		}

		return asteroids;
	}

    fire(playerId) {
        let ship = this.ships[playerId];
        let vel = ship.vel.clone().add(((new THREE.Vector3(0,0,-1)).applyQuaternion(ship.quaternion.clone())).multiplyScalar(500));

        this.bullets[this.currentBulletId] = new Bullet(playerId, ship.pos.clone(), vel);
        this.currentBulletId++;
    }

	update(dt) {
	    for (const [asteroidId, asteroid] of Object.entries(this.asteroids)) {
            asteroid.update(dt);
		}

        for (const [bulletId, bullet] of Object.entries(this.bullets)) {
            bullet.update(dt);
            if (bullet.lifetime <= 0) {
                delete this.bullets[bulletId];
            }
        }

        for (const [playerId, ship] of Object.entries(this.ships)) {
            ship.update(dt);
        }

        // Do collision later...
        // for (const [playerId, bullets] of Object.entries(this.bullets)) {
        //     for (let i = bullets.length - 1; i >= 0; i--) {
        //         let bullet = bullets[i]
        //         bullet.update(dt);

        //         if (bullet.lifetime <= 0) {
        //             bullets.splice(i, 1);
        //         } else {
        //             for (const [asteroidId, asteroid] of Object.entries(this.asteroids)) {
        //                 if ((bullet.pos.clone().sub(asteroid.pos.clone())).length() <= asteroid.r) {
        //                   bullets.splice(i, 1);
        //                   delete this.asteroids[asteroidId];
        //                   break;
        //                 }
        //             }
        //         }
        //     }
        // }

        
	}
}

module.exports = Engine;
