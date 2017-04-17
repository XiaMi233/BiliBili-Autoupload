import path from 'path'
import webpack from 'webpack'

export default (DEBUG, VERBOSE) => {
  const AUTOPREFIXER_BROWSERS = [
    'Android 2.3',
    'Android >= 4',
    'Chrome >= 35',
    'Firefox >= 31',
    'Explorer >= 9',
    'iOS >= 7',
    'Opera >= 12',
    'Safari >= 7.1',
  ]
  const GLOBALS = {
    'process.env.NODE_ENV': DEBUG ? JSON.stringify('development') : JSON.stringify('production'),
    __DEV__: DEBUG
  }
//
// Common configuration chunk to be used for both
// client-side (app.js) and server-side (server.js) bundles
// -----------------------------------------------------------------------------

  return {
    output: {
      path: '',
      publicPath: DEBUG ? '/' : './',
      sourcePrefix: '  ',
    },

    cache: DEBUG,
    debug: DEBUG,

    stats: {
      colors: true,
      reasons: DEBUG,
      hash: VERBOSE,
      version: VERBOSE,
      timings: true,
      chunks: VERBOSE,
      chunkModules: VERBOSE,
      cached: VERBOSE,
      cachedAssets: VERBOSE,
    },

    plugins: [
      new webpack.optimize.OccurenceOrderPlugin(),
      new webpack.DefinePlugin(GLOBALS),
      new webpack.ProvidePlugin({
        "React": "react",
      })
    ],

    resolve: {
      modulesDirectories: ['node_modules', 'local_modules'],
      extensions: ['', '.webpack.js', '.web.js', '.js', '.jsx'],
      alias: {
      },
      root: [path.join(__dirname, '../../app')]
    },

    module: {
      loaders: [{
          test: /\.(png|jpg|jpeg|gif|svg|woff|woff2)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
          loader: 'url-loader?name=font/[name].[ext]&limit=5000', // small than 5kb
        }, {
          test: /\.(eot|ttf|wav|mp3)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
          loader: 'file-loader?name=font/[name].[ext]',
        }
      ]
    },

    postcss: function plugins() {
      return [
        // require('postcss-smart-import')({
        //   onImport: files => files.forEach(this.addDependency),
        //   path: ['./src/', './src/public/']
        // }),
        require('postcss-nested')(),
        require('postcss-cssnext')({autoprefixer: AUTOPREFIXER_BROWSERS}),
      ];
    }
  }
}