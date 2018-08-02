module.exports = {
  extends: ['eslint:recommended', 'prettier'],
  plugins: ['prettier'],
  parser: 'babel-eslint',
  parserOptions: {
    "ecmaVersion": 6,
    "sourceType": "module",
    "ecmaFeatures": {
      "jsx": true
    }
  },
  rules: {
    'no-console': 'off',
    'no-constant-condition': ['error', { 'checkLoops': false }],
    'max-len': ['error', { 'code': 120 }],
    'prettier/prettier': [
      'error',
      {
        singleQuote: true, 
        trailingComma: 'all',
      },
    ]
  }
};
