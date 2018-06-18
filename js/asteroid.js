const THREE = require('three');

class Asteroid {
	constructor(pos, r, vel, axis, angle) {
		this.pos = pos;
		this.r = r;
		this.vel = vel;
		this.axis = axis;
		this.angle = angle;
	}

	update(dt) {
		this.pos.add(this.vel.clone().multiplyScalar(dt));
	}
}

module.exports = Asteroid;
