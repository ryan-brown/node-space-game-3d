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
        let bulletData = "";
        bulletData += `${this.pos.x.toFixed(3)},${this.pos.y.toFixed(3)},${this.pos.z.toFixed(3)},`;
        bulletData += `${this.vel.x.toFixed(3)},${this.vel.y.toFixed(3)},${this.vel.z.toFixed(3)}`;
        return bulletData;
    }

    static deserialize(data) {
        let bulletData = data.split(",").map(v => parseFloat(v));
        let pos = new THREE.Vector3(bulletData[0], bulletData[1], bulletData[2]);
        let vel = new THREE.Vector3(bulletData[3], bulletData[4], bulletData[5]);

        return new Bullet(pos, vel)
    }
}

module.exports = Bullet;
