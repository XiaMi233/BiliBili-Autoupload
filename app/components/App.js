const {ipcRenderer} = require('electron');

var $ = require('jquery');
var path = require('path');
var phantomjs = require('phantomjs');
var spawn = require('child_process').spawn;
var fs = require('fs');
var moment = require('moment');
var analyzeDir = require('./analyze_dir');
var spawnPhantom = require('./spawn-phantom');
var _ = require('lodash');

//检查登录状态

var LOGGED = false;
var fileList = [];
var setting = {};

function checkLogin() {
  var childArgs = [
    path.join(__dirname, '/../shellCmd/check_login.js'),
  ];
  spawnPhantom(phantomjs.path, childArgs, dispose);
}

checkLogin();

//读取设置

var $loginForm = $('#jsLogin');
var $settingForm = $('#jsSettingForm');

readSetting();

function readSetting() {
  fs.readFile(path.resolve(__dirname, '../../setting.ini'), function(err, data) {
    if (err) throw err;
    setting = JSON.parse(data.toString());
    if (setting['video-dir']) {
      $('#jsVideoDir').text(setting['video-dir']);
      $('#jsVideoDirPath').val(setting['video-dir']);
    }
    $settingForm.find('input[name=is-auto-upload]').prop('checked', !!setting['is-auto-upload']);
    $settingForm.find('input[name=is-today-upload]').prop('checked', !!setting['is-today-upload']);
  });
}

function checkNeedContributions() {
  if (!LOGGED || !setting['video-dir']) {
    console.log('未登录 不验证稿件');
    return false;
  }
  var fileList = analyzeDir.getAllFiles(setting['video-dir']);
  var contributions = _(fileList).chain().map(function(file) {
    file.timestamp = moment(file.filename, 'YYYYMMDD_HHmmss.flv').unix();
    return file;
  }).sortBy(function(o) {
    return o.timestamp;
    // 'timestamp'
  }).map(function(file) {
    return moment(file.filename, 'YYYYMMDD_HHmmss.flv').format('YYYY年MM月');
  }).uniq().value();

  contributions = ['Taylor', '洛天依'];
  checkExistContributions(contributions);
}

//事件绑定 暂时放这
$loginForm.on('submit', function() {
  login();
});

$('.js-setting').on('change', function() {
  const setting = {
    'video-dir': $settingForm.find('#jsVideoDirPath').val(),
    'is-auto-upload': $settingForm.find('input[name=is-auto-upload]').is(':checked') ? 1 : 0,
    'is-today-upload': $settingForm.find('input[name=is-today-upload]').is(':checked') ? 1 : 0
  };

  fs.writeFile(path.resolve(__dirname, '../../setting.ini'), JSON.stringify(setting), (err) => {
    if (err) throw err;
  });
});

$('#jsVideoDir').on('click', function (event) {
  ipcRenderer.send('open-file-dialog-for-file');
});
ipcRenderer.on('selected-file', function (event, path) {
  $('#jsVideoDir').text(path);
  $('#jsVideoDirPath').val(path).change();
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

  spawnPhantom(phantomjs.path, childArgs, dispose);
}

function autoUpload() {
  var childArgs = [
    path.join(__dirname, '/../shellCmd/auto_upload.js')
  ];

  spawnPhantom(phantomjs.path, childArgs, dispose);
}

function checkExistContributions(contributions) {
  var childArgs = [
    path.join(__dirname, '/../shellCmd/check-exist-contributions.js'),
    JSON.stringify(contributions)
  ];

  spawnPhantom(phantomjs.path, childArgs, dispose);
}

function noLogin() {
  $('#jsLogin').removeClass('hidden');
  $('#jsLoginCheck').addClass('hidden');
  $('#vCodeImg').attr('src', '../v_code.png?_t=' + Math.random());
}

function logged() {
  LOGGED = true;
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
      checkNeedContributions();
      // autoUpload();
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

