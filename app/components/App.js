var process = require('child_process');
//直接调用命令

var child = process.exec('phantomjs ' + __dirname  + '/../shellCmd/login.js',
  function (error, stdout, stderr) {
    console.log(stdout);
    if (error !== null) {
      console.log('exec error:' + error);
    }
  });

child.on('message', function(m) {
  console.log('main listen: ' + m);
});
