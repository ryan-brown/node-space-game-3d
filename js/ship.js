import * as THREE from 'three';
import Util from './util.js';
import Bullet from './bullet.js';
import config from './config.js';

class Ship {
  constructor(
    username,
    hue,
    score,
    position,
    velocity,
    maxVelocity,
    acceleration,
    rotateVelocity,
    maxRotateVelocity,
    rotateAcceleration,
    quaternion,
    health,
    maxHealth,
    passiveHealthRegen,
    activeHealthRegen,
    energy,
    maxEnergy,
    energyRegen,
    fireRate,
    fireCooldown,
    keysPressed,
  ) {
    this.username = username;
    this.hue = hue;
    this.score = score;
    this.position = position;
    this.velocity = velocity;
    this.maxVelocity = maxVelocity;
    this.acceleration = acceleration;
    this.rotateVelocity = rotateVelocity;
    this.maxRotateVelocity = maxRotateVelocity;
    this.rotateAcceleration = rotateAcceleration;
    this.quaternion = quaternion;
    this.health = health;
    this.maxHealth = maxHealth;
    this.passiveHealthRegen = passiveHealthRegen;
    this.activeHealthRegen = activeHealthRegen;
    this.energy = energy;
    this.maxEnergy = maxEnergy;
    this.energyRegen = energyRegen;
    this.fireRate = fireRate;
    this.fireCooldown = fireCooldown;
    this.keysPressed = keysPressed;
    this.overrideFire = false;
  }

  static randomShip(
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
    fireRate,
  ) {
    return new Ship(
      username,
      hue,
      0,
      Util.randomVector3(750),
      new THREE.Vector3(),
      maxVelocity,
      acceleration,
      new THREE.Vector3(),
      maxRotateVelocity,
      rotateAcceleration,
      new THREE.Quaternion(),
      maxHealth,
      maxHealth,
      passiveHealthRegen,
      activeHealthRegen,
      maxEnergy,
      maxEnergy,
      energyRegen,
      fireRate,
      0,
      [],
    );
  }

  isKeyPressed(key) {
    return this.keysPressed.includes(config['keyMap'][key]);
  }

  reset() {
    this.position = Util.randomVector3(750);
    this.velocity = new THREE.Vector3();
    this.rotateVelocity = new THREE.Vector3();
    this.quaternion = new THREE.Quaternion();
    this.health = this.maxHealth;
    this.energy = this.maxEnergy;
    this.fireCooldown = 0;
    this.keysPressed = [];
    this.overrideFire = false;
  }

  rotateShip(x, y, z, w) {
    const currentQuaternion = this.quaternion;
    const multiplyQuaternion = new THREE.Quaternion(
      Math.sin(x / 2),
      Math.sin(y / 2),
      Math.sin(z / 2),
      Math.cos(w / 2),
    ).normalize();
    currentQuaternion.multiplyQuaternions(
      currentQuaternion,
      multiplyQuaternion,
    );
    this.quaternion = currentQuaternion;
  }

  canFire() {
    return (
      this.fireCooldown <= 0 && (this.isKeyPressed('fire') || this.overrideFire)
    );
  }

  fire(playerId) {
    this.fireCooldown = 1 / this.fireRate;

    const bulletVelocity = this.velocity
      .clone()
      .add(
        new THREE.Vector3(0, 0, -1)
          .applyQuaternion(this.quaternion)
          .multiplyScalar(400),
      );
    this.overrideFire = false;
    return new Bullet(playerId, this.position.clone(), bulletVelocity);
  }

  takeDamage(damage) {
    this.health -= damage;
    if (this.health < 0) {
      this.reset();
      return true;
    }
    return false;
  }

  update(dt) {
    if (this.isKeyPressed('pitchUp') && !this.isKeyPressed('pitchDown'))
      this.rotateVelocity.x += this.rotateAcceleration * dt;
    else if (this.isKeyPressed('pitchDown') && !this.isKeyPressed('pitchUp'))
      this.rotateVelocity.x -= this.rotateAcceleration * dt;

    if (this.isKeyPressed('yawRight') && !this.isKeyPressed('yawLeft'))
      this.rotateVelocity.y += this.rotateAcceleration * dt;
    else if (this.isKeyPressed('yawLeft') && !this.isKeyPressed('yawRight'))
      this.rotateVelocity.y -= this.rotateAcceleration * dt;

    if (this.isKeyPressed('rollLeft') && !this.isKeyPressed('rollRight'))
      this.rotateVelocity.z += this.rotateAcceleration * dt;
    else if (this.isKeyPressed('rollRight') && !this.isKeyPressed('rollLeft'))
      this.rotateVelocity.z -= this.rotateAcceleration * dt;

    if (this.rotateVelocity.x > this.maxRotateVelocity)
      this.rotateVelocity.x = this.maxRotateVelocity;
    else if (this.rotateVelocity.x < -this.maxRotateVelocity)
      this.rotateVelocity.x = -this.maxRotateVelocity;

    if (this.rotateVelocity.y > this.maxRotateVelocity)
      this.rotateVelocity.y = this.maxRotateVelocity;
    else if (this.rotateVelocity.y < -this.maxRotateVelocity)
      this.rotateVelocity.y = -this.maxRotateVelocity;

    if (this.rotateVelocity.z > this.maxRotateVelocity)
      this.rotateVelocity.z = this.maxRotateVelocity;
    else if (this.rotateVelocity.z < -this.maxRotateVelocity)
      this.rotateVelocity.z = -this.maxRotateVelocity;

    const dtRotateVelocity = this.rotateVelocity.clone().multiplyScalar(dt);

    this.rotateShip(dtRotateVelocity.x, 0, 0, dtRotateVelocity.x);
    this.rotateShip(0, dtRotateVelocity.y, 0, dtRotateVelocity.y);
    this.rotateShip(0, 0, dtRotateVelocity.z, dtRotateVelocity.z);

    const consumedBoostEnerty = 25 * dt;
    if (
      this.isKeyPressed('accelerate') &&
      this.energy - consumedBoostEnerty >= 0
    ) {
      this.velocity.add(
        new THREE.Vector3(0, 0, -1)
          .applyQuaternion(this.quaternion)
          .multiplyScalar(this.acceleration * dt),
      );
      this.energy -= consumedBoostEnerty;
    }
    if (this.velocity.length() > this.maxVelocity)
      this.velocity.normalize().multiplyScalar(this.maxVelocity);

    this.position.add(this.velocity.clone().multiplyScalar(dt));
    this.energy += this.energyRegen * dt;
    this.health += this.passiveHealthRegen * dt;

    const consumedHealEnergy = 25 * dt;
    if (
      this.isKeyPressed('heal') &&
      this.energy - consumedHealEnergy >= 0 &&
      this.health < this.maxHealth
    ) {
      this.health += this.activeHealthRegen * dt;
      this.energy -= consumedHealEnergy;
    }

    if (this.fireCooldown > 0) this.fireCooldown -= dt;

    if (this.energy > this.maxEnergy) this.energy = this.maxEnergy;
    if (this.health > this.maxHealth) this.health = this.maxHealth;
  }

  serialize() {
    const shipIntData = [this.hue, this.score];
    const shipFloatData = [
      this.position.x,
      this.position.y,
      this.position.z,
      this.velocity.x,
      this.velocity.y,
      this.velocity.z,
      this.maxVelocity,
      this.acceleration,
      this.rotateVelocity.x,
      this.rotateVelocity.y,
      this.rotateVelocity.z,
      this.maxRotateVelocity,
      this.rotateAcceleration,
      this.quaternion.x,
      this.quaternion.y,
      this.quaternion.z,
      this.quaternion.w,
      this.health,
      this.maxHealth,
      this.passiveHealthRegen,
      this.activeHealthRegen,
      this.energy,
      this.maxEnergy,
      this.energyRegen,
      this.fireRate,
      this.fireCooldown,
    ];

    let returnData = `${this.username},${Util.serializeInts(
      shipIntData,
    )},${Util.serializeFloats(3, shipFloatData)}`;
    if (this.keysPressed.length > 0)
      returnData += `,${Util.serializeInts(this.keysPressed)}`;

    return returnData;
  }

  static deserialize(data) {
    const shipData = data.split(',');

    const username = shipData[0];

    const [hue, score] = shipData.slice(1, 3).map(v => parseInt(v));

    const shipFloats = shipData.slice(3, 29).map(v => parseFloat(v));
    const position = new THREE.Vector3(
      shipFloats[0],
      shipFloats[1],
      shipFloats[2],
    );
    const velocity = new THREE.Vector3(
      shipFloats[3],
      shipFloats[4],
      shipFloats[5],
    );
    const maxVelocity = shipFloats[6];
    const acceleration = shipFloats[7];
    const rotateVelocity = new THREE.Vector3(
      shipFloats[8],
      shipFloats[9],
      shipFloats[10],
    );
    const maxRotateVelocity = shipFloats[11];
    const rotateAcceleration = shipFloats[12];
    const quaternion = new THREE.Quaternion(
      shipFloats[13],
      shipFloats[14],
      shipFloats[15],
      shipFloats[16],
    );
    const health = shipFloats[17];
    const maxHealth = shipFloats[18];
    const passiveHealthRegen = shipFloats[19];
    const activeHealthRegen = shipFloats[20];
    const energy = shipFloats[21];
    const maxEnergy = shipFloats[22];
    const energyRegen = shipFloats[23];
    const fireRate = shipFloats[24];
    const fireCooldown = shipFloats[25];

    const keysPressed = shipData.slice(29).map(v => parseInt(v));

    return new Ship(
      username,
      hue,
      score,
      position,
      velocity,
      maxVelocity,
      acceleration,
      rotateVelocity,
      maxRotateVelocity,
      rotateAcceleration,
      quaternion,
      health,
      maxHealth,
      passiveHealthRegen,
      activeHealthRegen,
      energy,
      maxEnergy,
      energyRegen,
      fireRate,
      fireCooldown,
      keysPressed,
    );
  }
}

export default Ship;
