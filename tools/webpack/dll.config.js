import path from 'path'
import merge from 'lodash.merge'
import webpack from 'webpack'
import ExtractTextPlugin from 'extract-text-webpack-plugin'

export default config => {
  return merge({}, config, {
    entry: {
      vendor: [
        'react',
        'redux',
        'jquery',
        'underscore',
        'imports?window=>global!./src/lib/js/material.js',
        'imports?window=>global!./src/lib/js/ripples.min.js',
        'imports?window=>global!./src/lib/js/datetimepicker.js',
        'imports?window=>global!./src/lib/js/jquery.qrcode.min.js',
        './src/lib/js/tiny-slider.min.js',
        './src/lib/build.dll.jsx'
      ]
    },
    output: {
      path: path.join(__dirname, '../../src/dll'),
      filename: '[name].js',
      library: '[name]_library',
      context: path.join(__dirname, '../..'),
      publicPath: '/'
    },

    plugins: [
      ...config.plugins,
      new webpack.DllPlugin({
        path: path.join(__dirname, '../../src/dll', '[name]-manifest.json'),
        name: '[name]_library'
      }),
      new ExtractTextPlugin('[name].styles.css'),
      new webpack.optimize.DedupePlugin(),
      new webpack.optimize.UglifyJsPlugin({
        compress: {
          warnings: true,
        },
      }),
      new webpack.optimize.AggressiveMergingPlugin()
    ],
    module: {
      loaders: [
        ...config.module.loaders,
        {
          test: /\.jsx?$/,
          loader: 'babel',
          include: [path.join(__dirname, '../../src')]
        },
        {
          test: /\.css$/,
          loader: ExtractTextPlugin.extract('css!postcss')
          // loader: 'css-loader!postcss-loader',
        }
      ]
    }
  });
}
