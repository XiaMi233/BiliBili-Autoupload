import path from 'path';
import webpack from 'webpack';
import WebpackDevServer from 'webpack-dev-server';
// import Express from 'express';
// import devMiddleware from 'webpack-dev-middleware';
// import hotMiddleware from 'webpack-hot-middleware';
import config from '../webpack.config';
import {port} from '../port.config';

let proxyTarget = 'http://bilibili.com';

// const app = new Express();

// const compiler = webpack(config);
//
// app.use(devMiddleware(compiler, {
//   publicPath: config.output.publicPath,
//   noInfo: true
// }));
//
// app.use(hotMiddleware(compiler));
//
// app.use(Express.static('www'));
// // app.get('*', (req, res) => {
// //   res.format({
// //     'text/html': function(){
// //       res.sendFile(path.resolve('www', 'index.html'));
// //     }
// //   });
// //   // res.sendFile(path.resolve('www', 'popup.html'), {
// //   //   headers: {
// //   //     'Content-Type': 'text/html; charset=UTF-8'
// //   //   }
// //   // });
// // });
//
// app.listen(port, error => {
//   if (error) {
//     return console.error(error);
//   }
//
//   console.log(`Listening at http://localhost:${port}`);
// });

new WebpackDevServer(webpack(config), {
  publicPath: config.output.publicPath,
  hot: true,
  historyApiFallback: true,
  proxy: [
    {
      path: '*.json',
      target: proxyTarget,
      changeOrigin: true
    }
  ],
  watchOptions: {
    aggregateTimeout: 300,
    poll: 1000
  },
  headers: {'X-Custom-Header': 'no'},
  stats: {
    colors: true,
    hash: true,
    version: true,
    timings: true,
    chunks: false,
    chunkModules: true,
    cached: true,
    cachedAssets: true,
    assets: false
  }
}).listen(port, function(err, result) {
  if(err) {
    console.log(err);
  }

  console.log(`Listening at localhost:${port}`);
});
