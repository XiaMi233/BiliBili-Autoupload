import webpack from 'webpack';
import task from './lib/task';

const webpackConfig = require('./webpack.config').getConfig('app'); // Client-side bundle configuration

module.exports =  task('start', async () => {

  await require('./clean')();

  webpack(webpackConfig, function(err, stats) {
    if(err) throw new console.error("webpack", err);
    console.log("[webpack]", stats.toString({
    }));
  });
});
