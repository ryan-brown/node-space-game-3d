module.exports = {
  mapRadius: 1000,
  numOfAsteroids: 200,
  randomAsteroid: {
    radiusMin: 5,
    radiusMax: 50,
    velocityMin: 5,
    velocityMax: 25
  },
  shipStats: {
    maxVelocity: [50, 60, 70, 80, 90, 100],
    acceleration: [50, 60, 70, 80, 90, 100],
    maxRotateVelocity: [Math.PI/2, Math.PI/1.8, Math.PI/1.6, Math.PI/1.4, Math.PI/1.2, Math.PI],
    rotateAcceleration: [Math.PI/2, Math.PI/1.8, Math.PI/1.6, Math.PI/1.4, Math.PI/1.2, Math.PI],
    maxHealth: [100, 120, 140, 165, 180, 200],
    passiveHealthRegen: [1, 1.2, 1.4, 1.6, 1.8, 2],
    activeHealthRegen: [3, 3.4, 3.8, 4.2, 4.6, 5],
    maxEnergy: [100, 120, 140, 165, 180, 200],
    energyRegen: [10, 12, 14, 16, 18, 20],
    fireRate: [2, 2.4, 2.8, 3.2, 3.6, 4]
  },
  keyMap: {
    accelerate: 32, // spacebar
    pitchUp: 87, // w
    pitchDown: 83, // s
    yawLeft: 68, // d
    yawRight: 65, // a
    rollLeft: 81, // q
    rollRight: 69, // e
    fire: 80, // p
    heal: 72 // h
  }
}
