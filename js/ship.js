const THREE = require('three');

class Ship {
	constructor(pos, vel, rotateVel, quaternion) {
		this.pos = pos;
		this.vel = vel;
		this.rotateVel = rotateVel;
		this.quaternion = quaternion;

		this.accel = 45;
		this.maxVel = 60;

		this.rotateAccel = Math.PI/2;
		this.maxRotateVel = Math.PI/4;

		this.keysPressed = {}
	}

	rotateShip(x, y, z, w) {
		const currentQuaternion = this.quaternion;
		const multiplyQuaternion = (new THREE.Quaternion(Math.sin(x/2), Math.sin(y/2), Math.sin(z/2), Math.cos(w/2))).normalize();
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
		if (this.keysPressed[87] && !this.keysPressed[83]) this.rotateVel.x += this.rotateAccel*dt;
		else if (this.keysPressed[83] && !this.keysPressed[87]) this.rotateVel.x -= this.rotateAccel*dt;

		if (this.keysPressed[65] && !this.keysPressed[68]) this.rotateVel.y += this.rotateAccel*dt;
		else if (this.keysPressed[68] && !this.keysPressed[65]) this.rotateVel.y -= this.rotateAccel*dt;

		if (this.keysPressed[81] && !this.keysPressed[69]) this.rotateVel.z += this.rotateAccel*dt;
		else if (this.keysPressed[69] && !this.keysPressed[81]) this.rotateVel.z -= this.rotateAccel*dt;

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

		if (this.keysPressed[32]) this.vel.add(((new THREE.Vector3(0,0,-1)).applyQuaternion(this.quaternion)).multiplyScalar(this.accel*dt));
		if (this.vel.length() > this.maxVel) this.vel.normalize().multiplyScalar(this.maxVel);

		this.pos.add(this.vel.clone().multiplyScalar(dt));
	}
}

module.exports = Ship;
