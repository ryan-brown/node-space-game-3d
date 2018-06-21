const THREE = require('three');

class Bullet {
    constructor(pos, vel, playerId = "abc") {
        this.playerId = playerId;
        this.pos = pos;
        this.vel = vel;
        this.lifetime = 3;
    }

    update(dt) {
        this.lifetime -= dt;
        this.pos.add(this.vel.clone().multiplyScalar(dt));
    }

    serialize() {
        return [this.pos.x, this.pos.y, this.pos.z, this.vel.x, this.vel.y, this.vel.z];
    }

    static deserialize(data) {
        let pos = new THREE.Vector3(data[0], data[1], data[2]);
        let vel = new THREE.Vector3(data[3], data[4], data[5]);

        return new Bullet(pos, vel)
    }
}

module.exports = Bullet;
