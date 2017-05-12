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

//检查登录状态

function checkLogin() {
  var childArgs = [
    path.join(__dirname, '/../shellCmd/checkLogin.js'),
  ];
  var child = spawn(phantomjs.path, childArgs);

  child.stdout.on('data', function (data) {
    console.log('stdout: ' + data);
    if (data.indexOf('out_data:') > -1) {
      dispose(data.toString().replace('out_data:', '').trim());
    }
  });

  child.stderr.on('data', function (data) {
    console.log('stderr: ' + data);
  });

  child.on('close', function (code) {
    console.log('child process exited with code ' + code);
  });
}

checkLogin();

var $loginForm = $('#jsLogin');

//事件绑定 暂时放这
$loginForm.on('submit', function() {
  login();
});

function login() {
  var $userId = $loginForm.find('[name=userid]');
  var $pwd = $loginForm.find('[name=pwd]');
  var $vdcode = $loginForm.find('[name=vdcode]');
  var userId = $userId.val().trim();
  var pwd = $pwd.val();
  var vdcode = $vdcode.val();

  var childArgs = [
    path.join(__dirname, '/../shellCmd/doLogin.js'),
    userId,
    pwd,
    vdcode
  ];

  var child = spawn(phantomjs.path, childArgs);

  child.stdout.on('data', function (data) {
    console.log('stdout: ' + data);
    if (data.indexOf('out_data:') > -1) {
      dispose(data.toString().replace('out_data:', '').trim());
    }
  });

  child.stderr.on('data', function (data) {
    console.log('stderr: ' + data);
  });

  child.on('close', function (code) {
    console.log('child process exited with code ' + code);
  });
}


function dispose(signal) {
  console.log('处理命令：'+ signal);
  switch(signal) {
    case 'NO_LOGIN':
      $('#jsLogin').removeClass('hidden');
      $('#jsLoginCheck').addClass('hidden');
      $('#vCodeImg').attr('src', '../test.png?_t=' + Math.random());
      break;
    default:
      console.log('无效命令：'+ signal);
      break;
  }
}

