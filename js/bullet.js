const THREE = require('three');

class Bullet {
  constructor(playerId, position, velocity) {
    this.playerId = playerId;
    this.position = position;
    this.velocity = velocity;
    this.lifetime = 3;
  }

  update(dt) {
    this.lifetime -= dt;
    this.position.add(this.velocity.clone().multiplyScalar(dt));
  }

  serialize() {
    let bulletData = `${this.playerId},`
    bulletData += `${this.position.x.toFixed(3)},${this.position.y.toFixed(3)},${this.position.z.toFixed(3)},`;
    bulletData += `${this.velocity.x.toFixed(3)},${this.velocity.y.toFixed(3)},${this.velocity.z.toFixed(3)}`;

    return bulletData;
  }

  static deserialize(data) {
    const bulletData = data.split(",");
    const playerId = bulletData[0];
    const bulletFloats = bulletData.slice(1).map(v => parseFloat(v));

    const position = new THREE.Vector3(bulletFloats[0], bulletFloats[1], bulletFloats[2]);
    const velocity = new THREE.Vector3(bulletFloats[3], bulletFloats[4], bulletFloats[5]);

    return new Bullet(playerId, position, velocity)
  }
}

module.exports = Bullet;
