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

  validateData(data) {
    const username = data["username"];
    const hue = parseInt(data["hue"]) || 0;
    const maxVelocity = parseInt(data["maxVelocity"]) || 0;
    const acceleration = parseInt(data["acceleration"]) || 0;
    const maxRotateVelocity = parseInt(data["maxRotateVelocity"]) || 0;
    const rotateAcceleration = parseInt(data["rotateAcceleration"]) || 0;
    const maxHealth = parseInt(data["maxHealth"]) || 0;
    const passiveHealthRegen = parseInt(data["passiveHealthRegen"]) || 0;
    const activeHealthRegen = parseInt(data["activeHealthRegen"]) || 0;
    const maxEnergy = parseInt(data["maxEnergy"]) || 0;
    const energyRegen = parseInt(data["energyRegen"]) || 0;
    const fireRate = parseInt(data["fireRate"]) || 0;

    if (RegExp(/^[a-z0-9]+$/i).test(username) &&
      maxVelocity + acceleration + maxRotateVelocity +
      rotateAcceleration + maxHealth + passiveHealthRegen +
      activeHealthRegen + maxEnergy + energyRegen + fireRate <= 20) {
      return {
        username,
        hue,
        maxVelocity,
        acceleration,
        maxRotateVelocity,
        rotateAcceleration,
        maxHealth,
        passiveHealthRegen,
        activeHealthRegen,
        maxEnergy,
        energyRegen,
        fireRate
      }
    } else return false;
  }

  addShip(playerId, data) {
    const username = data["username"];
    const hue = data["hue"];

    const shipStats = this.config["shipStats"];

    const maxVelocity = shipStats["maxVelocity"][data["maxVelocity"]];
    const acceleration = shipStats["acceleration"][data["acceleration"]];
    const maxRotateVelocity = shipStats["maxRotateVelocity"][data["maxRotateVelocity"]];
    const rotateAcceleration = shipStats["rotateAcceleration"][data["rotateAcceleration"]];
    const maxHealth = shipStats["maxHealth"][data["maxHealth"]];
    const passiveHealthRegen = shipStats["passiveHealthRegen"][data["passiveHealthRegen"]];
    const activeHealthRegen = shipStats["activeHealthRegen"][data["activeHealthRegen"]];
    const maxEnergy = shipStats["maxEnergy"][data["maxEnergy"]];
    const energyRegen = shipStats["energyRegen"][data["energyRegen"]];
    const fireRate = shipStats["fireRate"][data["fireRate"]];

    this.ships[playerId] = Ship.randomShip(
      username, hue, maxVelocity, acceleration, maxRotateVelocity, rotateAcceleration,
      maxHealth, passiveHealthRegen, activeHealthRegen,
      maxEnergy, energyRegen, fireRate);
  }

  removeShip(playerId) {
    delete this.ships[playerId];
  }

  generateAsteroids(n) {
    const maxDistance = this.config["mapRadius"];
    const radiusMin = this.config["randomAsteroid"]["radiusMin"];
    const radiusMax = this.config["randomAsteroid"]["radiusMax"];
    const velocityMin = this.config["randomAsteroid"]["velocityMin"];
    const velocityMax = this.config["randomAsteroid"]["velocityMax"];

    let asteroids = {}
    for (let i = 0; i < n; i++) {
      asteroids[this.currentAsteroidId] = Asteroid.generateRandom(maxDistance-radiusMax, radiusMin, radiusMax, velocityMin, velocityMax);
      this.currentAsteroidId++;
    }

    return asteroids;
  }

  splitAsteroid(asteroid) {
    const velocityMin = this.config["randomAsteroid"]["velocityMin"];
    const velocityMax = this.config["randomAsteroid"]["velocityMax"];

    const asteroid1 = Asteroid.generateRandom(asteroid.radius, asteroid.radius/3, asteroid.radius/2, velocityMin, velocityMax, asteroid.position.clone());
    const asteroid2 = Asteroid.generateRandom(asteroid.radius, asteroid.radius/3, asteroid.radius/2, velocityMin, velocityMax, asteroid.position.clone());

    this.asteroids[this.currentAsteroidId] = asteroid1;
    this.newAsteroids.push(this.currentAsteroidId);
    this.currentAsteroidId++;

    this.asteroids[this.currentAsteroidId] = asteroid2;
    this.newAsteroids.push(this.currentAsteroidId);
    this.currentAsteroidId++;
  }

  update(dt) {
    const mapRadius = this.config["mapRadius"];

    for (const [asteroidId, asteroid] of Object.entries(this.asteroids)) {
      asteroid.update(dt);

      if (asteroid.position.length() + asteroid.radius > mapRadius) {
        asteroid.position.normalize().multiplyScalar(mapRadius-asteroid.radius);
        asteroid.velocity.multiplyScalar(-1);
        this.updateAsteroids.push(asteroidId);
      }
    }

    for (const [playerId, ship] of Object.entries(this.ships)) {
      if(ship.canFire()) {
        this.bullets[this.currentBulletId] = ship.fire(playerId);
        this.newBullets.push(this.currentBulletId);
        this.currentBulletId++;
      }
      ship.update(dt);

      if (ship.position.length() > mapRadius) {
        ship.takeDamage(10*dt);
      }
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
        if ((bullet.position.clone().sub(ship.position.clone())).length() <= 10 && shipId != bullet.playerId) {
          if (ship.takeDamage(50)) {
            this.ships[bullet.playerId].score += 1;
          }
          this.removedBullets.push(bulletId);
          delete this.bullets[bulletId];
          shipHit = true;
          break;
        }
      }

      if (shipHit) continue;

      for (const [asteroidId, asteroid] of Object.entries(this.asteroids)) {
        if ((bullet.position.clone().sub(asteroid.position.clone())).length() <= asteroid.radius) {
          if (asteroid.radius > 10) {
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
        if (this.removedBullets.hasOwnProperty(bulletId)) {
          this.removedBullets.filter(e => e !== bulletId);
        } else {
          newBullets[bulletId] = this.bullets[bulletId].serialize();
        }
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