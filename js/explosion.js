const THREE = require('three');
const Util = require('./util.js');

class Explosion {
  constructor(position) {
    console.log(position);
    this.lifetime = 2;
    this.particleCount = 100;

    this.particleGeometry = new THREE.Geometry();
    this.addParticles(position);
    let particleMaterial = new THREE.PointsMaterial({color: 0xffff00, size: 1});
    this.mesh = new THREE.Points(this.particleGeometry, particleMaterial);
  }

  addParticles(position) {
    for (var p = 0; p < this.particleCount; p++) {
      let particle = position.clone();
      particle.velocity = Util.randomVector3(25, 5);
      this.particleGeometry.vertices.push(particle);
    }
  }

  update(dt) {
    this.lifetime -= dt;
    for (var p = 0; p < this.particleCount; p++) {
      const particle = this.particleGeometry.vertices[p];
      particle.add(particle.velocity.clone().multiplyScalar(dt));
    }
    this.particleGeometry.verticesNeedUpdate = true;
  }
}

module.exports = Explosion;
