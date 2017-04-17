import path from 'path'
import merge from 'lodash.merge'
import webpack from 'webpack'
import HtmlWebpackPlugin from 'html-webpack-plugin'
import AddAssetHtmlPlugin from 'add-asset-html-webpack-plugin'

export default (config, WATCH, DEBUG, VERBOSE) => {
  return merge({}, config, {
    entry: {
      app: [
        'font-awesome-webpack',
        ...(WATCH ? ['react-hot-loader/patch', 'webpack-dev-server/client?http://localhost:5000', 'webpack/hot/only-dev-server'] : []),
        './app/index'
      ]
    },
    output: {
      path: path.join(__dirname, '../../www'),
      // path: path.join(__dirname, '../../build/public'),
      filename: DEBUG ? 'bundle.[name].js' : '[name].[hash].bundle.js',
      chunkFilename: '[name].[chunkhash].bundle.js'
    },

    // Choose a developer tool to enhance debugging
    // http://webpack.github.io/docs/configuration.html#devtool
    // devtool: DEBUG ? 'cheap-eval-source-map' : false,
    devtool: DEBUG ? '#inline-source-map' : false,
    plugins: [
      ...config.plugins,
      ...(!DEBUG ? [
        new webpack.optimize.DedupePlugin(),
        new webpack.optimize.UglifyJsPlugin({
          compress: {
            warnings: VERBOSE,
          },
        }),
        new webpack.optimize.AggressiveMergingPlugin()
      ] : []),
      ...(WATCH ? [
        new webpack.HotModuleReplacementPlugin(),
        new webpack.NoErrorsPlugin(),
      ] : []),
      new webpack.optimize.CommonsChunkPlugin({
        name: 'lib',
        minChunks: Infinity
      }),
      new HtmlWebpackPlugin({
        template: './entry/index.html'
      })
    ],
    module: {
      loaders: [
        ...config.module.loaders,
        {
          test: /\.jsx?$/,
          loader: 'babel',
          // include: [path.join(__dirname, 'app')]
        },
        {
          test: /\.css$/,
          loader: 'style-loader/useable!css-loader!postcss-loader',
        }
      ]
    }
  })
}
