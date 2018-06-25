const THREE = require('three');
const Ship = require('./ship.js');
const Bullet = require('./bullet.js');
const Asteroid = require('./asteroid.js');

class Engine {
    constructor(config) {
        this.config = config;
        this.ships = {};

        this.currentBulletId = 0;
        this.bullets = {};
        this.currentAsteroidId = 0;
        this.asteroids = this.generateAsteroids(this.config["numOfAsteroids"]);

        this.newBullets = [];
        this.removedBullets = [];

        this.newAsteroids = [];
        this.updateAsteroids = [];
        this.removedAsteroids = [];
    }

    addShip(playerId, data) {
        this.ships[playerId] = Ship.randomShip(data);
    }

    removeShip(playerId) {
        delete this.ships[playerId];
    }

    generateAsteroids(n) {
        const maxDist = this.config["mapRadius"];
        const rMin = this.config["randomAsteroid"]["rMin"];
        const rMax = this.config["randomAsteroid"]["rMax"];
        const velMin = this.config["randomAsteroid"]["velMin"];
        const velMax = this.config["randomAsteroid"]["velMax"];

        let asteroids = {}
        for (let i = 0; i < n; i++) {
            asteroids[this.currentAsteroidId] = Asteroid.generateRandom(maxDist, rMin, rMax, velMin, velMax);
            this.currentAsteroidId++;
        }

        return asteroids;
    }

    splitAsteroid(asteroid) {
        const velMin = this.config["randomAsteroid"]["velMin"];
        const velMax = this.config["randomAsteroid"]["velMax"];

        const asteroid1 = Asteroid.generateRandom(asteroid.r, asteroid.r/3, asteroid.r/2, velMin, velMax, asteroid.pos.clone());
        const asteroid2 = Asteroid.generateRandom(asteroid.r, asteroid.r/3, asteroid.r/2, velMin, velMax, asteroid.pos.clone());

        this.asteroids[this.currentAsteroidId] = asteroid1;
        this.newAsteroids.push(this.currentAsteroidId);
        this.currentAsteroidId++;

        this.asteroids[this.currentAsteroidId] = asteroid2;
        this.newAsteroids.push(this.currentAsteroidId);
        this.currentAsteroidId++;
    }

    fire(playerId, data) {
        this.bullets[this.currentBulletId] = Bullet.fromShip(playerId, this.ships[playerId]);
        this.newBullets.push(this.currentBulletId);
        this.currentBulletId++;
    }

    update(dt) {
        for (const [asteroidId, asteroid] of Object.entries(this.asteroids)) {
            asteroid.update(dt);

            const r = this.config["mapRadius"];
            if (asteroid.pos.length() + asteroid.r > r) {
                asteroid.pos.normalize().multiplyScalar(r-asteroid.r);
                asteroid.vel.multiplyScalar(-1);
                this.updateAsteroids.push(asteroidId);
            }
        }

        for (const [playerId, ship] of Object.entries(this.ships)) {
            ship.update(dt);
        }

        for (const [bulletId, bullet] of Object.entries(this.bullets)) {
            bullet.update(dt);
            if (bullet.lifetime <= 0) {
                this.removedBullets.push(bulletId);
                delete this.bullets[bulletId];
                continue;
            }

            let shipHit = false;
            for (const [shipId, ship] of Object.entries(this.ships)) {
                if ((bullet.pos.clone().sub(ship.pos.clone())).length() <= 10 && shipId != bullet.playerId) {
                    this.ships[bullet.playerId].score += 1;
                    this.removedBullets.push(bulletId);
                    delete this.bullets[bulletId];
                    this.ships[shipId] = Ship.randomShip({username: ship.username, hue: ship.hue});
                    shipHit = true;
                    break;
                }
            }

            if (shipHit) continue;

            for (const [asteroidId, asteroid] of Object.entries(this.asteroids)) {
                if ((bullet.pos.clone().sub(asteroid.pos.clone())).length() <= asteroid.r) {
                    if (asteroid.r > 10) {
                        this.splitAsteroid(asteroid);
                    }
                    this.removedBullets.push(bulletId);
                    this.removedAsteroids.push(asteroidId);
                    delete this.bullets[bulletId];
                    delete this.asteroids[asteroidId];
                    break;
                }
            }
        }
    }

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
            if (this.bullets.hasOwnProperty(bulletId)) {
                newBullets[bulletId] = this.bullets[bulletId].serialize();
            }
        }

        let newAsteroids = {};
        for (let asteroidId of this.newAsteroids) {
            newAsteroids[asteroidId] = this.asteroids[asteroidId].serialize();
        }

        let updateAsteroids = {};
        for (let asteroidId of this.updateAsteroids) {
            updateAsteroids[asteroidId] = this.asteroids[asteroidId].serialize();
        }

        let updateShips = {};
        for (let [shipId, ship] of Object.entries(this.ships)) {
            updateShips[shipId] = ship.serialize();
        }

        return [newBullets, newAsteroids, this.removedBullets, this.removedAsteroids, updateAsteroids, updateShips];
    }
}

module.exports = Engine;