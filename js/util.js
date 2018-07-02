const THREE = require('three');

class Util {
  static random(max, min = 0) {
    return (max - min) * Math.random() + min;
  }

  static randomVector3(maxLength = 1, minLength = 0) {
    while (true) {
      const randVec = new THREE.Vector3(Util.random(1,-1), Util.random(1,-1), Util.random(1,-1));

      if (randVec.length() <= 1) {
        const length = Util.random(maxLength, minLength);
        return (randVec.normalize()).multiplyScalar(length);
      }
    }
  }

  static serializeFloats(precision, list) {
    return list.map(v => v.toFixed(precision)).join(",");
  }

  static serializeInts(list) {
    return list.join(",");
  }
}

module.exports = Util;