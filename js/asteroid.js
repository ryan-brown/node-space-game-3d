import * as THREE from 'three';
import Util from './util';

class Asteroid {
  constructor(radius, position, velocity, rotationAxis, rotationSpeed) {
    this.radius = radius;
    this.position = position;
    this.velocity = velocity;
    this.rotationAxis = rotationAxis;
    this.rotationSpeed = rotationSpeed;
  }

  update(dt) {
    this.position.add(this.velocity.clone().multiplyScalar(dt));
  }

  static generateRandom(
    maxDistance,
    radiusMin,
    radiusMax,
    velocityMin,
    velocityMax,
    position = new THREE.Vector3(),
  ) {
    const radius = Util.random(radiusMax, radiusMin);
    position.add(Util.randomVector3(maxDistance));
    const velocity = Util.randomVector3(velocityMax, velocityMin);
    const rotationAxis = Util.randomUnitVector3();
    const rotationSpeed = Util.random(Math.PI / 8, -Math.PI / 8);

    return new Asteroid(
      radius,
      position,
      velocity,
      rotationAxis,
      rotationSpeed,
    );
  }

  serialize() {
    let asteroidData = `${this.radius.toFixed(3)},`;
    asteroidData += `${this.position.x.toFixed(3)},${this.position.y.toFixed(
      3,
    )},${this.position.z.toFixed(3)},`;
    asteroidData += `${this.velocity.x.toFixed(3)},${this.velocity.y.toFixed(
      3,
    )},${this.velocity.z.toFixed(3)},`;
    asteroidData += `${this.rotationAxis.x.toFixed(
      3,
    )},${this.rotationAxis.y.toFixed(3)},${this.rotationAxis.z.toFixed(3)},`;
    asteroidData += `${this.rotationSpeed}`;
    return asteroidData;
  }

  static deserialize(data) {
    let asteroidData = data.split(',').map(v => parseFloat(v));

    let radius = asteroidData[0];
    let position = new THREE.Vector3(
      asteroidData[1],
      asteroidData[2],
      asteroidData[3],
    );
    let velocity = new THREE.Vector3(
      asteroidData[4],
      asteroidData[5],
      asteroidData[6],
    );
    let rotationAxis = new THREE.Vector3(
      asteroidData[7],
      asteroidData[8],
      asteroidData[9],
    );
    let rotationSpeed = asteroidData[10];

    return new Asteroid(
      radius,
      position,
      velocity,
      rotationAxis,
      rotationSpeed,
    );
  }
}

export default Asteroid;
