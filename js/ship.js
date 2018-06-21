const THREE = require('three');

class Ship {
    constructor(pos = new THREE.Vector3(), vel = new THREE.Vector3(), rotateVel = new THREE.Vector3(), quaternion = new THREE.Quaternion(), keysPressed = []) {
        this.pos = pos;
        this.vel = vel;
        this.rotateVel = rotateVel;
        this.quaternion = quaternion;
        this.keysPressed = keysPressed;

        this.accel = 45;
        this.maxVel = 60;

        this.rotateAccel = Math.PI / 2;
        this.maxRotateVel = Math.PI / 4;
    }

    rotateShip(x, y, z, w) {
        const currentQuaternion = this.quaternion;
        const multiplyQuaternion = (new THREE.Quaternion(Math.sin(x / 2), Math.sin(y / 2), Math.sin(z / 2), Math.cos(w / 2))).normalize();
        currentQuaternion.multiplyQuaternions(currentQuaternion, multiplyQuaternion);
        this.quaternion = currentQuaternion;
    }

    //87: w
    //83: s
    //65: a
    //68: d
    //81: q
    //69: e
    //32: space
    update(dt) {
        if (this.keysPressed.includes(87) && !this.keysPressed.includes(83)) this.rotateVel.x += this.rotateAccel * dt;
        else if (this.keysPressed.includes(83) && !this.keysPressed.includes(87)) this.rotateVel.x -= this.rotateAccel * dt;

        if (this.keysPressed.includes(65) && !this.keysPressed.includes(68)) this.rotateVel.y += this.rotateAccel * dt;
        else if (this.keysPressed.includes(68) && !this.keysPressed.includes(65)) this.rotateVel.y -= this.rotateAccel * dt;

        if (this.keysPressed.includes(81) && !this.keysPressed.includes(69)) this.rotateVel.z += this.rotateAccel * dt;
        else if (this.keysPressed.includes(69) && !this.keysPressed.includes(81)) this.rotateVel.z -= this.rotateAccel * dt;

        if (this.rotateVel.x > this.maxRotateVel) this.rotateVel.x = this.maxRotateVel;
        else if (this.rotateVel.x < -this.maxRotateVel) this.rotateVel.x = -this.maxRotateVel;

        if (this.rotateVel.y > this.maxRotateVel) this.rotateVel.y = this.maxRotateVel;
        else if (this.rotateVel.y < -this.maxRotateVel) this.rotateVel.y = -this.maxRotateVel;

        if (this.rotateVel.z > this.maxRotateVel) this.rotateVel.z = this.maxRotateVel;
        else if (this.rotateVel.z < -this.maxRotateVel) this.rotateVel.z = -this.maxRotateVel;

        const dtRotateVelocity = this.rotateVel.clone().multiplyScalar(dt);
        this.rotateShip(dtRotateVelocity.x, 0, 0, dtRotateVelocity.x);
        this.rotateShip(0, dtRotateVelocity.y, 0, dtRotateVelocity.y);
        this.rotateShip(0, 0, dtRotateVelocity.z, dtRotateVelocity.z);

        if (this.keysPressed.includes(32)) this.vel.add(((new THREE.Vector3(0, 0, -1)).applyQuaternion(this.quaternion)).multiplyScalar(this.accel * dt));
        if (this.vel.length() > this.maxVel) this.vel.normalize().multiplyScalar(this.maxVel);

        this.pos.add(this.vel.clone().multiplyScalar(dt));
    }

    serialize() {
        return [this.pos.x, this.pos.y, this.pos.z, this.vel.x, this.vel.y, this.vel.z, this.rotateVel.x, this.rotateVel.y, this.rotateVel.z, this.quaternion.x, this.quaternion.y, this.quaternion.z, this.quaternion.w, this.keysPressed];
    }

    static deserialize(data) {
        let pos = new THREE.Vector3(data[0], data[1], data[2]);
        let vel = new THREE.Vector3(data[3], data[4], data[5]);
        let rotateVel = new THREE.Vector3(data[6], data[7], data[8]);
        let quaternion = new THREE.Quaternion(data[9], data[10], data[11], data[12]);
        let keysPressed = data[13];

        return new Ship(pos, vel, rotateVel, quaternion, keysPressed);
    }
}

module.exports = Ship;