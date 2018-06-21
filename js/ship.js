const THREE = require('three');

class Ship {
    constructor(pos = new THREE.Vector3(), vel = new THREE.Vector3(), rotateVel = new THREE.Vector3(), quaternion = new THREE.Quaternion(), score = 0, keysPressed = []) {
        this.pos = pos;
        this.vel = vel;
        this.rotateVel = rotateVel;
        this.quaternion = quaternion;
        this.keysPressed = keysPressed;

        this.accel = 45;
        this.maxVel = 60;

        this.rotateAccel = Math.PI / 2;
        this.maxRotateVel = Math.PI / 4;

        this.score = score;
    }

    static randomShip() {
        const randX = 500 * Math.random() - 250;
        const randY = 500 * Math.random() - 250;
        const randZ = 500 * Math.random() - 250;

        return new Ship(new THREE.Vector3(randX, randY, randZ));
    }

    rotateShip(x, y, z, w) {
        const currentQuaternion = this.quaternion;
        const multiplyQuaternion = (new THREE.Quaternion(Math.sin(x / 2), Math.sin(y / 2), Math.sin(z / 2), Math.cos(w / 2))).normalize();
        currentQuaternion.multiplyQuaternions(currentQuaternion, multiplyQuaternion);
        this.quaternion = currentQuaternion;
    }

    // 87:w 83:s 65:a 68:d 81:q 69:e 32:space
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
        let shipData = "";
        shipData += `${this.pos.x.toFixed(3)},${this.pos.y.toFixed(3)},${this.pos.z.toFixed(3)},`;
        shipData += `${this.vel.x.toFixed(3)},${this.vel.y.toFixed(3)},${this.vel.z.toFixed(3)},`;
        shipData += `${this.rotateVel.x.toFixed(3)},${this.rotateVel.y.toFixed(3)},${this.rotateVel.z.toFixed(3)},`;
        shipData += `${this.quaternion.x.toFixed(3)},${this.quaternion.y.toFixed(3)},${this.quaternion.z.toFixed(3)},${this.quaternion.w.toFixed(3)},`;
        shipData += this.score;
        return [shipData, this.keysPressed];
    }

    static deserialize(data) {
        let shipData = data[0].split(",").map(v => parseFloat(v));
        let pos = new THREE.Vector3(shipData[0], shipData[1], shipData[2]);
        let vel = new THREE.Vector3(shipData[3], shipData[4], shipData[5]);
        let rotateVel = new THREE.Vector3(shipData[6], shipData[7], shipData[8]);
        let quaternion = new THREE.Quaternion(shipData[9], shipData[10], shipData[11], shipData[12]);
        let score = shipData[13];

        let keysPressed = data[1];

        return new Ship(pos, vel, rotateVel, quaternion, score, keysPressed);
    }
}

module.exports = Ship;