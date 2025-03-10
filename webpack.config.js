const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = [
  {
    entry: './src/index.js',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'tridecco-board.js',
      library: 'Tridecco',
      libraryTarget: 'umd',
    },
    mode: 'development',
  },
  {
    entry: './src/index.js',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'tridecco-board.min.js',
      library: 'Tridecco',
      libraryTarget: 'umd',
    },
    mode: 'production',
    optimization: {
      minimize: true,
      minimizer: [new TerserPlugin()],
    },
  },
];
