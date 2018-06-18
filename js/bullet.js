const THREE = require('three');

class Bullet {
	constructor(playerId, pos, vel) {
		this.playerId = playerId;
		this.pos = pos;
		this.vel = vel;
		this.lifetime = 3;
	}

	update(dt) {
		this.lifetime -= dt;
		this.pos.add(this.vel.clone().multiplyScalar(dt));
	}
}

module.exports = Bullet;
