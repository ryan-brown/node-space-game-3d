const THREE = require('three');
const Ship = require('./ship.js');
const Bullet = require('./bullet.js');
const Asteroid = require('./asteroid.js');

class Engine {
    constructor() {
        this.ships = {};
        this.bullets = {};
        this.currentBulletId = 0;
        this.asteroids = this.generateAsteroids(2000);

        this.newBullets = [];
        this.removedBullets = [];
    }

    addShip(playerId) {
        this.ships[playerId] = new Ship();
    }

    removeShip(playerId) {
        delete this.ships[playerId];
    }

    generateAsteroids(n) {
        let asteroids = {}
        let currentId = 0;
        for (let i = 0; i < n; i++) {
            asteroids[currentId] = Asteroid.generateRandom(2000, 5, 50, 0.1, 10, Math.PI / 4);
            currentId++;
        }

        return asteroids;
    }

    fire(playerId) {
        let ship = this.ships[playerId];
        let vel = ship.vel.clone().add(((new THREE.Vector3(0, 0, -1)).applyQuaternion(ship.quaternion.clone())).multiplyScalar(200));

        this.bullets[this.currentBulletId] = new Bullet(ship.pos.clone(), vel, playerId);
        this.newBullets.push(this.currentBulletId);
        this.currentBulletId++;
    }

    update(dt) {
        for (const [asteroidId, asteroid] of Object.entries(this.asteroids)) {
            asteroid.update(dt);
        }

        for (const [bulletId, bullet] of Object.entries(this.bullets)) {
            bullet.update(dt);
            if (bullet.lifetime <= 0) {
                this.removedBullets.push(bulletId);
                delete this.bullets[bulletId];
                continue;
            }

            for (const [shipId, ship] of Object.entries(this.ships)) {
                //console.log(bullet.pos.clone().sub(ship.pos.clone()));
                if ((bullet.pos.clone().sub(ship.pos.clone())).length() <= 3 && shipId != bullet.playerId) {
                    //this.removedBullets.push(bulletId)
                    this.ships[shipId] = new Ship();
                }
            }
        }

        for (const [playerId, ship] of Object.entries(this.ships)) {
            ship.update(dt);
        }
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

    serialize(playerId) {
        let asteroids = {};
        for (let [asteroidId, asteroid] of Object.entries(this.asteroids)) {
            asteroids[asteroidId] = asteroid.serialize();
        }

        let bullets = {};
        for (let [bulletId, bullet] of Object.entries(this.bullets)) {
            bullets[bulletId] = bullet.serialize();
        }

        let ships = {};
        for (let [shipId, ship] of Object.entries(this.ships)) {
            ships[shipId] = ship.serialize();
        }

        return [playerId, asteroids, bullets, ships];
    }

    updateSerialize() {
        let newBullets = {};
        for (let bulletId of this.newBullets) {
            newBullets[bulletId] = this.bullets[bulletId].serialize();
        }

        let updateShips = {};
        for (let [shipId, ship] of Object.entries(this.ships)) {
            updateShips[shipId] = ship.serialize();
        }

        return [newBullets, this.removedBullets, updateShips];
    }
}

module.exports = Engine;