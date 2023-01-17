const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
const WriteFilePlugin = require('write-file-webpack-plugin');

module.exports = merge(common, {
  output: {
    path: `${__dirname}/../../origo/plugins`,
    publicPath: '/build/js',
    filename: 'fme.js',
    libraryTarget: 'var',
    libraryExport: 'default',
    library: 'FME'
  },
  mode: 'development',
  module: {
    rules: [{
      test: /\.scss$/,
      use: [{
        loader: 'style-loader'
      },
      {
        loader: 'css-loader'
      },
      {
        loader: 'sass-loader'
      }
      ]
    }]
  },
  plugins: [
    new WriteFilePlugin()
  ],
  devServer: {
    static: './',
    port: 9008,
    devMiddleware: {
      writeToDisk: true
    }, 
  }
});
