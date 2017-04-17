import webpack from 'webpack';
import webpackConfig from '../webpack.config'

webpack(webpackConfig, function(err, stats) {
  if(err) throw new console.error("webpack", err);
  console.log("[webpack]", stats.toString({
  }));
});
