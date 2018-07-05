const THREE = require('three');

class Util {
  static random(max, min = 0) {
    return (max - min) * Math.random() + min;
  }

  static randomUnitVector3() {
    while (true) {
      const randVec = new THREE.Vector3(Util.random(1,-1), Util.random(1,-1), Util.random(1,-1));

      if (randVec.length() <= 1) {
        return randVec.normalize();
      }
    }
  }

  static randomVector3(maxLength = 1, minLength = 0) {
    return Util.randomUnitVector3().multiplyScalar(Util.random(maxLength, minLength));
  }

  static serializeFloats(precision, list) {
    return list.map(v => v.toFixed(precision)).join(",");
  }

  static serializeInts(list) {
    return list.join(",");
  }
}

module.exports = Util;