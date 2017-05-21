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

//是否登录
var LOGGED = false;

//是否正在录像 3分钟断档
var IS_RECORDING = false;
var RECORDING_CHECK_DURATION = 3 * 60 * 1000;
var INIT_CHECK_RECORDING = true;

//是否存在的稿子
var CONTRIBUTION_LIST = [];
//需要上传的全部录像文件
var FILE_LIST = [];
var UPLOAD_CONTRIBUTION_LIST = [];

//设置
var SETTING = {};

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
    SETTING = JSON.parse(data.toString());
    if (SETTING['video-dir']) {
      $('#jsVideoDir').text(SETTING['video-dir']);
      $('#jsVideoDirPath').val(SETTING['video-dir']);
    }
    $settingForm.find('input[name=is-auto-upload]').prop('checked', !!SETTING['is-auto-upload']);
    $settingForm.find('input[name=is-today-upload]').prop('checked', !!SETTING['is-today-upload']);

    settingUpdate();
  });
}

function updateFileList() {
  FILE_LIST = analyzeDir.getAllFiles(SETTING['video-dir']);
}

function checkNeedContributions() {
  if (!LOGGED || !SETTING['video-dir']) {
    console.log('未登录 不验证稿件');
    return false;
  }
  updateFileList();
  var contributions = _(FILE_LIST).chain().map(function(file) {
    file.timestamp = moment(file.filename, 'YYYYMMDD_HHmmss.flv').unix();
    return file;
  }).sortBy(function(o) {
    return o.timestamp;
    // 'timestamp'
  }).map(function(file) {
    return moment(file.filename, 'YYYYMMDD_HHmmss.flv').format('YYYY年MM月');
  }).uniq().value();

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
    //设定更改后
    readSetting();
  });
});

$('#jsVideoDir').on('click', function (event) {
  ipcRenderer.send('open-file-dialog-for-file');
});

ipcRenderer.on('selected-file', function(event, path) {
  if (SETTING['video-dir'] !== path) {
    $('#jsVideoDir').text(path);
    $('#jsVideoDirPath').val(path).change();
  }
});

function settingUpdate() {
  //清空数据
  IS_RECORDING = false;
  //需要上传的全部录像文件
  FILE_LIST = [];

  INIT_CHECK_RECORDING = true;
  //是否存在的稿子
  CONTRIBUTION_LIST = [];
  checkNeedContributions();

  //停止所有正在上传的视频

  console.log('设置更新完毕');
}

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

var lastVideoSize;
var recordingCheckFlag;

setInterval(function() {
  if (LOGGED && SETTING['video-dir']) {
    checkRecording();
  }
}, 5000);

function uploadAll() {
  //上传的时候file_list是不会变化的，录播的时候不上传，上传途中则停止上传

  if (!UPLOAD_CONTRIBUTION_LIST.length) {
    console.log('asdfasd' + UPLOAD_CONTRIBUTION_LIST.length);
    UPLOAD_CONTRIBUTION_LIST = _(FILE_LIST).map(function(file) {
      file.timestamp = moment(file.filename, 'YYYYMMDD_HHmmss.flv').unix();
      file.contributionName = moment(file.filename, 'YYYYMMDD_HHmmss.flv').format('YYYY年MM月');
      return file;
    }).groupBy('contributionName').value();

    _.each(UPLOAD_CONTRIBUTION_LIST, function(uploadContribution) {
      uploadContribution.child = autoUpload(uploadContribution);
    });
  }

  // console.log(FILE_LIST, contributions);
  // autoUpload();
  // "2017年04月"
  // filename
  //   :
  //   "20170413_170753.flv"
  // pathname
  //   :
  //   "D:\录制\35582/20170413_170753.flv"
  // timestamp
  //   :
  //   1492074473
}

function checkRecording() {
  updateFileList();
  const lastVideo = _(FILE_LIST).chain().map(function(file) {
    file.timestamp = moment(file.filename, 'YYYYMMDD_HHmmss.flv').unix();
    return file;
  }).sortBy(function(o) {
    return -o.timestamp;
    // 'timestamp'
  }).first().value();

  var currentSize = analyzeDir.getFileSize(lastVideo.pathname);

  if (!INIT_CHECK_RECORDING) {
    var isRecording = lastVideoSize !== currentSize && lastVideoSize;
  }
  lastVideoSize = currentSize;

  if (INIT_CHECK_RECORDING) {
    INIT_CHECK_RECORDING = false;
    setTimeout(function() {
      checkRecording();
    }, 2000);
    return false;
  }

  //不在录播状态 进入录播状态
  if (isRecording) {
    IS_RECORDING = true;
    console.log('录播中');
    clearTimeout(recordingCheckFlag);
    recordingCheckFlag = setTimeout(function() {
      IS_RECORDING = false;
      console.log('退出录播状态三分钟');
    }, RECORDING_CHECK_DURATION);
  } else {
    console.log('未录播');
  }

  if (!INIT_CHECK_RECORDING && !IS_RECORDING) {
    uploadAll();
  }
}

function autoUpload(uploadContribution) {
  var childArgs = [
    path.join(__dirname, '/../shellCmd/auto_upload.js'),
    JSON.stringify(uploadContribution)
  ];

  return spawnPhantom(phantomjs.path, childArgs, dispose);
}

function checkExistContributions(contributions) {
  var childArgs = [
    path.join(__dirname, '/../shellCmd/check_exist_contributions.js'),
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
  $('#jsLogin').addClass('hidden');
  $('#jsLogged').removeClass('hidden');
}

function contributionDispose(obj) {
  CONTRIBUTION_LIST.push(obj);
  CONTRIBUTION_LIST = _.uniqBy(CONTRIBUTION_LIST, 'contribution');
}

function dispose(signal, obj) {
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
      break;
    case 'LOGIN_ERROR':
      //获取验证码重新登录
      break;

    case 'CONTRIBUTION_CHECKED':
      contributionDispose(obj);
      break;
    case 'MONITOR_UPDATE':
      $('#monitorImg').removeClass('hidden').attr('src', '../upload_monitor.png?_t=' + Math.random());
      //上传进度监测更新
      break;
    default:
      console.log('无效命令：'+ signal);
      break;
  }
}

