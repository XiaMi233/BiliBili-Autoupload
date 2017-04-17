import webpack from 'webpack';
import del from 'del';
import task from './lib/task';


const webpackConfig = require('./webpack.config').getConfig('dll'); // Client-side bundle configuration

/**
 * Launches a development web server with "live reload" functionality -
 * synchronizing URLs, interactions and code changes across multiple devices.
 */
module.exports =  task('dll', async () => {
  del('./src/dll/*');

  webpack(webpackConfig, function(err, stats) {
    if(err) throw new console.error("webpack", err);
    console.log("[webpack]", stats.toString({
      // output options
    }));
  });
});
