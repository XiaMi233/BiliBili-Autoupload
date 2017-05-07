// var process = require('child_process');
//直接调用命令

// var child = process.exec('phantomjs ' + __dirname  + '/../shellCmd/login.js',
//   function (error, stdout, stderr) {
//     console.log(stdout);
//     if (error !== null) {
//       console.log('exec error:' + error);
//     }
//   });

var $ = require('jquery');
var path = require('path');
var phantomjs = require('phantomjs');
var spawn = require('child_process').spawn;

var childArgs = [
  path.join(__dirname, '/../shellCmd/login.js'),
];
var child = spawn(phantomjs.path, childArgs);

child.stdout.on('data', function (data) {
  console.log('stdout: ' + data);
  if (data.indexOf('out_data:') > -1) {
    dispose(data.replace('out_data:'));
  }
});

child.stderr.on('data', function (data) {
  console.log('stderr: ' + data);
});

child.on('close', function (code) {
  console.log('child process exited with code ' + code);
});


//事件绑定 暂时放这
$('#jsLogin').on('submit', function() {
  alert(1);
});

function dispose(signal) {
  switch(signal) {
    case 'NO_LOGIN':
      $('#jsLogin').removeClass('hidden');
      break;
  }
}
