var process = require('child_process');
//直接调用命令

process.exec('casperjs ' + __dirname  + '/../shellCmd/login.js',
  function (error, stdout, stderr) {
    console.log(stdout);
    if (error !== null) {
      console.log('exec error:' + error);
    }
  });
