const {ipcRenderer} = require('electron');

window.$ = window.jQuery = require('../vendor/jquery-3.2.1');

var path = require('path');
var phantomjs = require('phantomjs');
var {exec} = require('child_process');
var fs = require('fs');
var moment = require('moment');
var analyzeDir = require('./analyze_dir');
var spawnPhantom = require('./spawn_phantom');
var _ = require('lodash');

var global = require('../shellCmd/global_variables');

//检查登录状态

//是否登录
var LOGGED = false;

//是否正在录像 2分钟断档
var RECORDING_CHECK_DURATION = 2 * 60 * 1000;
var IS_RECORDING = false;
var INIT_CHECK_RECORDING = true;
var CONTRIBUTION_LIST_LENGTH = 0;
var CHECKED_CONTRIBUTION_LIST_LENGTH = 0;
var CONTRIBUTIONS_CHECKING  = false;
//最小上传文件大小
// var MIN_FILE_SIZE = 1; //40MB
var MIN_FILE_SIZE = 40000000; //40MB


//是否存在的稿子
var CONTRIBUTION_LIST = [];
var CONTRIBUTION_CHECKED = false;
//需要上传的全部录像文件
var FILE_LIST = [];
var UPLOAD_CONTRIBUTION_LIST = [];

//是否正在上传标志
var IS_UPLOADING = false;

//上传spawn
var UPLOADING_SPAWN;

//设置
var SETTING = {};

function checkLogin() {
  var childArgs = [
    path.join(__dirname, '/../shellCmd/check_login.js'),
  ];
  spawnPhantom(phantomjs.path, childArgs, dispose);
}

function getVCode() {
  var childArgs = [
    path.join(__dirname, '/../shellCmd/get_valid_code.js'),
  ];
  spawnPhantom(phantomjs.path, childArgs, dispose);
}


//读取设置

var $loginForm = $('#jsLogin');
var $settingForm = $('#jsSettingForm');

function readSetting() {
  if (!fs.existsSync(path.resolve(__dirname, '../../setting.ini'))) {
    return false;
  }

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

  if (CONTRIBUTIONS_CHECKING) {
    return false;
  }

  updateFileList();

  if (_.isEmpty(FILE_LIST)) {
    return false;
  }

  CONTRIBUTIONS_CHECKING = true;

  var contributions = _(FILE_LIST).chain().map(function(file) {
    file.timestamp = moment(file.filename, 'YYYYMMDD_HHmmss.flv').unix();
    return file;
  }).sortBy(function(o) {
    return o.timestamp;
    // 'timestamp'
  }).map(function(file) {
    return moment(file.filename, 'YYYYMMDD_HHmmss.flv').format('YYYY年MM月');
  }).uniq().value();
  CONTRIBUTION_LIST_LENGTH = contributions.length;

  checkExistContributions(contributions);
}

//事件绑定 暂时放这
$loginForm.on('submit', function() {
  login();
});
$('#jsLogout').on('click', function() {
  $('#jsLogoutDialog').modal('show');
});
$('#jsLogoutConfirm').on('click', function() {
  //删除登录cookiejar，并重启软件
  fs.unlink(path.resolve(global.LOGINED_COOKIE_JAR), function(err, data) {
    if (err) return false;

    ipcRenderer.send('relaunch');
    $('#jsLogoutDialog').modal('hide');
  });
});

$('.js-setting').on('change', function() {
  const setting = {
    'video-dir': $settingForm.find('#jsVideoDirPath').val(),
    'is-auto-upload': $settingForm.find('input[name=is-auto-upload]').is(':checked') ? 1 : 0,
    'is-today-upload': $settingForm.find('input[name=is-today-upload]').is(':checked') ? 1 : 0
  };

  fs.writeFile(path.resolve('setting.ini'), JSON.stringify(setting), (err) => {
    if (err) throw err;
    //设定更改后
    readSetting();
  });
});

$('#jsVideoDir').on('click', function (event) {
  ipcRenderer.send('open-file-dialog-for-file');
});

//ipc
ipcRenderer.on('selected-file', function(event, path) {
  if (SETTING['video-dir'] !== path) {
    $('#jsVideoDir').text(path);
    $('#jsVideoDirPath').val(path).change();
  }
});

ipcRenderer.on('got-auto-shutdown', function(event, autoShutdown) {
  if (autoShutdown) {
    exec('shutdown /s /t 180');
    ipcRenderer.send('auto-shutdown-off');
  }
});

function settingUpdate() {
  //清空数据
  IS_RECORDING = false;
  //需要上传的全部录像文件
  FILE_LIST = [];

  INIT_CHECK_RECORDING = true;
  CONTRIBUTION_LIST_LENGTH = 0;
  //是否存在的稿子
  CONTRIBUTION_LIST = [];
  CONTRIBUTION_CHECKED = false;
  CHECKED_CONTRIBUTION_LIST_LENGTH = 0;
  CONTRIBUTIONS_CHECKING  = false;
  IS_UPLOADING = false;

  //停止所有正在上传的视频

  if (UPLOADING_SPAWN) {
    UPLOADING_SPAWN.kill('SIGHUP');
  }

  UPLOAD_CONTRIBUTION_LIST = [];

  checkNeedContributions();

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
  $('#jsError').html('');
  $('#jsLoginSubmit').button('loading');

  spawnPhantom(phantomjs.path, childArgs, dispose);
}

var lastVideoSize;
var recordingCheckFlag;

function moveSmallFile() {
  FILE_LIST = _.filter(FILE_LIST, (file) => {
    const isNeedUpload = analyzeDir.getFileSize(file.pathname) > MIN_FILE_SIZE;
    if (!isNeedUpload) {
      if (!fs.existsSync(path.resolve(SETTING['video-dir'], 'not_upload'))) {
        fs.mkdirSync(path.resolve(SETTING['video-dir'], 'not_upload'));
      }
      fs.rename(file.pathname, path.resolve(SETTING['video-dir'], 'not_upload', file.filename), function(err, data) {
        if (err) return false;
      });
    }
    return isNeedUpload;
  });
}

function uploadAll() {
  //上传的时候file_list是不会变化的，录播的时候不上传，上传途中则停止上传

  if (_.isEmpty(UPLOAD_CONTRIBUTION_LIST)) {
    //检查所有文件，把小于最小上传大小的文件移动到不需要上传的目录
    moveSmallFile();
    UPLOAD_CONTRIBUTION_LIST = _(FILE_LIST).map(function(file) {
      file.timestamp = moment(file.filename, 'YYYYMMDD_HHmmss.flv').unix();
      file.contributionName = moment(file.filename, 'YYYYMMDD_HHmmss.flv').format('YYYY年MM月');
      return file;
    }).groupBy('contributionName').value();
  }

  if (!_.isEmpty(UPLOAD_CONTRIBUTION_LIST)) {
    IS_UPLOADING = true;
    var contribution = _.find(CONTRIBUTION_LIST, {
      complete: false
    });

    UPLOADING_SPAWN = autoUpload(UPLOAD_CONTRIBUTION_LIST[contribution.contribution], contribution);
    delete UPLOAD_CONTRIBUTION_LIST[contribution.contribution];
  }
}

function checkRecording() {
  updateFileList();
  if (_.isEmpty(FILE_LIST)) {
    return false;
  }
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
      console.log('退出录播状态2分钟');
    }, RECORDING_CHECK_DURATION);
  } else {
    console.log('未录播', INIT_CHECK_RECORDING, IS_RECORDING, IS_UPLOADING, CONTRIBUTION_CHECKED);
  }

  if (!INIT_CHECK_RECORDING && !IS_RECORDING && !IS_UPLOADING && !CONTRIBUTION_CHECKED) {
    checkNeedContributions();
  }

  if (!INIT_CHECK_RECORDING && !IS_RECORDING && !IS_UPLOADING && CONTRIBUTION_CHECKED) {
    uploadAll();
  }

  //进入录播状态则停止上传
  if(IS_RECORDING && UPLOADING_SPAWN) {
    UPLOADING_SPAWN.kill('SIGHUP');
    settingUpdate();
  }
}

function autoUpload(uploadContribution, contribution) {
  var childArgs = [
    path.join(__dirname, '/../shellCmd/auto_upload.js'),
    JSON.stringify(uploadContribution),
    JSON.stringify(contribution)
  ];

  ipcRenderer.send('show-balloon', {
    title: '上传消息',
    content: '开始上传稿件 【直播录像】' + contribution.contribution + '集合'
  });

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
  $('#vCodeImg').attr('src', path.resolve('screenshots/v_code.png') + '?_t=' + Math.random());

  $('#jsLoginSubmit').button('reset').text('登录');
  $('#jsError').html('');
}

function logged() {
  LOGGED = true;
  $('#jsLoginCheck').addClass('hidden');
  $('#jsLogin').addClass('hidden');
  $('#jsLogged').removeClass('hidden');
  $('#jsLoginSubmit').button('reset');
}

function loginError(errorMsgs) {
  $('#jsError').html(errorMsgs.map((error) => {
    return error ? '<p>' + error + '</p>' : '';
  }));
  $('#jsLoginSubmit').text('重新获取验证码中');
  getVCode();
}

function contributionDispose(obj) {
  obj.complete = false;
  CONTRIBUTION_LIST.push(obj);
  CONTRIBUTION_LIST = _.uniqBy(CONTRIBUTION_LIST, 'contribution');
  CHECKED_CONTRIBUTION_LIST_LENGTH++;
  if (CONTRIBUTION_LIST_LENGTH === CHECKED_CONTRIBUTION_LIST_LENGTH) {
    CONTRIBUTION_CHECKED = true;
    console.log('投稿检测完成');
  }
}

function uploadComplete(obj) {
  _.find(CONTRIBUTION_LIST, {
    contribution: obj.contributionName
  }).complete = true;

  ipcRenderer.send('show-balloon', {
    title: '上传消息',
    content: '稿件 【直播录像】' + obj.contributionName + '集合上传完成'
  });

  moveCompleteFiles(obj.files);

  UPLOADING_SPAWN = null;

  if (_.filter(CONTRIBUTION_LIST, {
    complete: false
    }).length === 0) {
    ipcRenderer.send('show-balloon', {
      title: '上传消息',
      content: '稿件全部上传完成'
    });
    ipcRenderer.send('get-auto-shutdown');
    settingUpdate();
  }

  IS_UPLOADING = false;
}

function moveCompleteFiles(fileList) {
  _.each(fileList, (file) => {
    if (!fs.existsSync(path.resolve(SETTING['video-dir'], 'uploaded'))) {
      fs.mkdirSync(path.resolve(SETTING['video-dir'], 'uploaded'));
    }
    fs.rename(file.pathname, path.resolve(SETTING['video-dir'], 'uploaded', file.filename), function(err, data) {
      if (err) return false;
    });
  });
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
      break;
    case 'LOGIN_ERROR':
      //获取验证码重新登录
      loginError(obj);
      break;
    case 'CONTRIBUTION_CHECKED':
      contributionDispose(obj);
      break;
    case 'MONITOR_UPDATE':
      $('#monitorImg').removeClass('hidden').attr('src', path.resolve('screenshots/upload_monitor.png') + '?_t=' + Math.random());
      //上传进度监测更新
      break;
    case 'UPLOAD_COMPLETE':
      uploadComplete(obj);
      break;
    default:
      console.log('无效命令：'+ signal);
      break;
  }
}

function appInit() {
  checkLogin();
  readSetting();

  setInterval(function() {
    if (LOGGED && SETTING['video-dir']) {
      checkRecording();
    }
  }, 5000);
}

appInit();

ipcRenderer.send('get-auto-shutdown');
