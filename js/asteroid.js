const THREE = require('three');

class Asteroid {
    constructor(pos, r, vel) {
        this.pos = pos;
        this.r = r;
        this.vel = vel;
        // this.axis = axis;
        // this.angle = angle;
    }

    update(dt) {
        this.pos.add(this.vel.clone().multiplyScalar(dt));
    }

    static generateRandom(maxDist, rMin, rMax, velMin, velMax, startPos = new THREE.Vector3()) {
        const randX = 2 * maxDist * Math.random() - maxDist;
        const randY = 2 * maxDist * Math.random() - maxDist;
        const randZ = 2 * maxDist * Math.random() - maxDist;
        const pos = new THREE.Vector3(randX, randY, randZ)
        const finalPos = startPos.add(pos);

        const r = (rMax - rMin) * Math.random() + rMin;

        const randVelX = (velMax - velMin) * Math.random() - velMin;
        const randVelY = (velMax - velMin) * Math.random() - velMin;
        const randVelZ = (velMax - velMin) * Math.random() - velMin;
        const vel = new THREE.Vector3(randVelX, randVelY, randVelZ)

        return new Asteroid(finalPos, r, vel);
    }

    serialize() {
        return [this.pos.x, this.pos.y, this.pos.z, this.r, this.vel.x, this.vel.y, this.vel.z];
    }

    static deserialize(data) {
        let pos = new THREE.Vector3(data[0], data[1], data[2]);
        let r = data[3];
        let vel = new THREE.Vector3(data[4], data[5], data[6]);

        return new Asteroid(pos, r, vel)
    }
}

module.exports = Asteroid;