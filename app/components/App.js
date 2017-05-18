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
    path.join(__dirname, '/../shellCmd/check_login.js'),
  ];
  var child = spawn(phantomjs.path, childArgs);

  child.stdout.on('data', function (data) {
    console.log('stdout: ' + data);
    if (data.indexOf('out_data:') > -1) {
      data.toString().split('\n').forEach(function(info) {
        if (info.indexOf('out_data:') > -1) {
          dispose(info.replace('out_data:', '').trim());
        }
      });
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
    path.join(__dirname, '/../shellCmd/do_login.js'),
    userId,
    pwd,
    vdcode
  ];

  var child = spawn(phantomjs.path, childArgs);

  child.stdout.on('data', function (data) {
    console.log('stdout: ' + data);
    if (data.indexOf('out_data:') > -1) {
      data.toString().split('\n').forEach(function(info) {
        if (info.indexOf('out_data:') > -1) {
          dispose(info.replace('out_data:', '').trim());
        }
      });
    }
  });

  child.stderr.on('data', function (data) {
    console.log('stderr: ' + data);
  });

  child.on('close', function (code) {
    console.log('child process exited with code ' + code);
  });
}

function autoUpload() {
  var childArgs = [
    path.join(__dirname, '/../shellCmd/auto_upload.js')
  ];

  var child = spawn(phantomjs.path, childArgs);

  child.stdout.on('data', function (data) {
    console.log('stdout: ' + data);
    if (data.indexOf('out_data:') > -1) {
      data.toString().split('\n').forEach(function(info) {
        if (info.indexOf('out_data:') > -1) {
          dispose(info.replace('out_data:', '').trim());
        }
      });
    }
  });

  child.stderr.on('data', function (data) {
    console.log('stderr: ' + data);
  });

  child.on('close', function (code) {
    console.log('child process exited with code ' + code);
  });
}

function noLogin() {
  $('#jsLogin').removeClass('hidden');
  $('#jsLoginCheck').addClass('hidden');
  $('#vCodeImg').attr('src', '../v_code.png?_t=' + Math.random());
}

function logged() {
  $('#jsLoginCheck').addClass('hidden');
  $('#jsLogged').removeClass('hidden');
}

function dispose(signal) {
  console.log('处理命令：'+ signal);
  switch(signal) {
    case 'NO_LOGIN':
      noLogin();
      break;
    case 'LOGGED':
    case 'LOGIN_SUCCESS':
      //进行登录成功处理
      logged();
      autoUpload();
      break;
    case 'LOGIN_ERROR':
      //获取验证码重新登录
      break;
    case 'MONITOR_UPDATE':
      $('#monitorImg').removeClass('hidden').attr('src', '../upload_monitor.png?_t=' + Math.random());
      //监测更新
      break;
    default:
      console.log('无效命令：'+ signal);
      break;
  }
}

