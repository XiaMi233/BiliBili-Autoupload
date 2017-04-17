import browserSync from 'browser-sync';
import webpack from 'webpack';
import WebpackDevServer from 'webpack-dev-server';
import task from './lib/task';
import config from '../config'


global.WATCH = true;

const webpackConfig = require('./webpack.config').getConfig('app'); // Client-side bundle configuration
const bundler = webpack(webpackConfig);

/**
 * Launches a development web server with "live reload" functionality -
 * synchronizing URLs, interactions and code changes across multiple devices.
 */
module.exports =  task('start', async () => {
  // await require('./build')();
  // await require('./serve')();

  let proxy = [
    // {
    //   path: '*.json',
    //   target: config.proxy[config.proxyType],
    //   changeOrigin: true
    // },
    {
      path: 'mock/*.json',
      target: 'http://localhost:7070/'
    },
    // {
    //   path: '*',
    //   target: config.proxy[config.proxyType],
    //   changeOrigin: true
    // }
  ];

  // if (argv.mockup) {
  //   proxy = _(mockupConfig.routers).map(function(val, path) {
  //     return {
  //       path: path,
  //       target: 'http://localhost:7070/'
  //     };
  //   }).concat(proxy);
  // }

  new WebpackDevServer(bundler, {
    publicPath: webpackConfig.output.publicPath,
    hot: true,
    historyApiFallback: true,
    proxy: proxy,
    watchOptions: {
      aggregateTimeout: 300,
      poll: 1000
    },
    headers: {'X-Custom-Header': 'no'},
    stats: {
      colors: true,
      // reasons: DEBUG,
      hash: true,
      version: true,
      timings: true,
      chunks: false,
      chunkModules: true,
      cached: true,
      cachedAssets: true,
      assets: false
      // chunkModules: false
    }
  }).listen(config.port, function(err, result) {
    if (err) {
      console.log(err);
    }

    browserSync({
      proxy: `http://localhost:${config.port}/`,
      port: config.proxy.port
    });

    console.log(`Listening at localhost:${config.port}`);
  });
});
