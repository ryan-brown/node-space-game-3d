var path = require('path');

module.exports = {
  entry: './js/entry.js',
  mode: 'development',
  target: 'web',
  output: {
  	path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js'
  }
};
