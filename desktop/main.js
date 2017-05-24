const electron = require('electron');
const {ipcMain, dialog, Menu, Tray, autoUpdater} = require('electron');
// Module to control application life.
const app = electron.app;
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow;
const WinReg = require('winreg');
const RUN_LOCATION = '\\Software\\Microsoft\\Windows\\CurrentVersion\\Run';
const file = process.execPath;
const {exec} = require('child_process');
const fs = require('fs');

const path = require('path');
const url = require('url');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

let tray;

var APP_NAME = '录播自动上传工具';

function startupEventHandle(){
  if(require('electron-squirrel-startup')) return;
  var handleStartupEvent = function () {
    if (process.platform !== 'win32') {
      return false;
    }
    var squirrelCommand = process.argv[1];
    switch (squirrelCommand) {
      case '--squirrel-install':
      case '--squirrel-updated':
        install();
        return true;
      case '--squirrel-uninstall':
        uninstall();
        app.quit();
        return true;
      case '--squirrel-obsolete':
        app.quit();
        return true;
    }
    // 安装
    function install() {
      var cp = require('child_process');
      var updateDotExe = path.resolve(path.dirname(process.execPath), '..', 'update.exe');
      var target = path.basename(process.execPath);
      var child = cp.spawn(updateDotExe, ["--createShortcut", target], { detached: true });
      child.on('close', function(code) {
        app.quit();
      });
    }
    // 卸载
    function uninstall() {
      var cp = require('child_process');
      var updateDotExe = path.resolve(path.dirname(process.execPath), '..', 'update.exe');
      var target = path.basename(process.execPath);
      var child = cp.spawn(updateDotExe, ["--removeShortcut", target], { detached: true });
      child.on('close', function(code) {
        app.quit();
      });
    }
  };
  if (handleStartupEvent()) {
    return ;
  }
}
startupEventHandle();




function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 400,
    height: 500,
    title: APP_NAME,
    skipTaskbar: false,
    icon: __dirname + '/../build/img/icon@8x.png',
    autoHideMenuBar: true,
    maximizable: false
  })

  // and load the index.html of the app.
  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, '../app/index.html'),
    protocol: 'file:',
    slashes: true
  }))

  // Open the DevTools.
  // mainWindow.webContents.openDevTools();

  // Emitted when the window is closed.

  mainWindow.on('close', function (e) {
    mainWindow.hide();

    e.preventDefault();
  });

  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    // mainWindow.hide();
    // mainWindow = null
  });

  updateInit();
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
  createTray();
  createWindow();
});

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    // app.quit()
  }
})

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

ipcMain.on('open-file-dialog-for-file', function (e) {
  dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  }, function (files) {
    if (files) e.sender.send('selected-file', files[0]);
  });
});

ipcMain.on('relaunch', function() {
  app.relaunch({args: process.argv.slice(1).concat(['--relaunch'])});
  app.exit(0);
});

ipcMain.on('show-balloon', function (e, obj) {
  tray.displayBalloon(obj);
});

ipcMain.on('get-auto-shutdown', function (e) {
  settingRead((err, setting) => {
    e.sender.send('got-auto-shutdown', setting.autoShutdown);
  });
});
ipcMain.on('auto-shutdown-off', function (e) {
  settingWrite('autoShutdown', false, (err) => {
    if (err) throw err;
    createTray();

    tray.displayBalloon({
      title: '自动关机',
      content: '上传完成后3分钟自动关机'
    });
  });
});

function createTray() {
  //系统托盘图标
  tray = new Tray(__dirname + '/../build/img/tray-icon.png');
  //鼠标放到系统托盘图标上时的tips;
  tray.setToolTip(APP_NAME);
  tray.on('click', function () { // 左键单击时显示窗口
    mainWindow.show();
  });
  getAutoStartValue((err, value) => {
    settingRead((err, setting) => {
      const menu = Menu.buildFromTemplate([   // 定义右建菜单
        {label: '开机启动', type: 'checkbox', click: autoStartHandle, checked: value},
        {label: '上传完成自动关机', type: 'checkbox', click: autoShutdownHandle, checked: setting.autoShutdown},
        {label: '撤销自动关机', click: autoShutdownOffHandle},
        {label: '检查更新', click: updateHandle},
        {label: '关于', click: aboutHandle},
        {label: "退出", click: closeHandle}
      ]);
      tray.setContextMenu(menu);//应用右建菜单
    });
  });
}

function autoStartHandle(menu) {
  if (menu.checked) {
    enableAutoStart((err) => {
      if (err) return false;
    });
  } else {
    disableAutoStart((err) => {
      if (err) return false;
    });
  }
}

function autoShutdownOffHandle() {
  exec('shutdown -a');
}

function autoShutdownHandle(menu) {
  if (!menu.checked) {
    exec('shutdown -a');
  } else {
    tray.displayBalloon({
      title: '上传完成自动关机',
      content: '上传完成3分钟自动关机（如需要取消关机请使用撤销自动关机╮(￣▽￣)╭）'
    });
  }
  settingWrite('autoShutdown', menu.checked, (err) => {
    if (err) throw err;
  });
}

function aboutHandle() {
  dialog.showMessageBox({
    title: '关于' + APP_NAME,
    message: 'Version:1.0.0\r\n神は、乗り越えられる試練しか与えない。'
  })
}

function settingWrite(settingName, value, callback) {
  if (!fs.existsSync(path.resolve('menu_setting.ini'))) {
    fs.openSync(path.resolve('menu_setting.ini'), 'w', '0644');
  }

  fs.readFile(path.resolve('menu_setting.ini'), (err, data) => {
    if (err) throw err;
    var setting = JSON.parse(data.toString() || "{}");
    setting[settingName] = value;
    fs.writeFile(path.resolve('menu_setting.ini'), JSON.stringify(setting), callback);
  });
}

function settingRead(callback) {
  if (!fs.existsSync(path.resolve('menu_setting.ini'))) {
    callback({}, {});
    return false;
  }

  fs.readFile(path.resolve('menu_setting.ini'), (err, data) => {
    if (err) throw err;
    var setting = JSON.parse(data.toString() || "{}");
    callback(err, setting);
  });
}

function closeHandle() {
  tray.destroy();
  app.exit(0);
  // mainWindow.webContents.send('close-app');
}

// 获取是否开机启动
function getAutoStartValue(callback) {
  let key = new WinReg({hive: WinReg.HKCU, key: RUN_LOCATION});
  key.get('EUC', function (error, result) {
    callback(error, !!result);
  });
}

// 设置开机启动
function enableAutoStart(callback) {
  let key = new WinReg({hive: WinReg.HKCU, key: RUN_LOCATION});
  key.set('EUC', WinReg.REG_SZ, file, (err)=> {
    callback(err);
  });
}
// 取消开机启动
function disableAutoStart(callback) {
  let key = new WinReg({hive: WinReg.HKCU, key: RUN_LOCATION});
  key.remove('EUC',  (err)=>{
    callback(err);
  });
}


//autoUpdater

function updateInit() {
  let appName = APP_NAME;
  let appIcon = __dirname + '/../build/img/tray-icon.png';
  let message = {
    error: '检查更新出错',
    checking: '正在检查更新……',
    updateAva: '下载更新成功',
    updateNotAva: '现在使用的就是最新版本，不用更新',
    downloaded: '最新版本已下载，将在重启程序后更新'
  };
  const os = require('os');
  autoUpdater.setFeedURL('http://118.190.116.191:1337/download/latest');
  autoUpdater.on('error', function (error) {
    return dialog.showMessageBox(mainWindow, {
      type: 'info',
      icon: appIcon,
      buttons: ['OK'],
      title: appName,
      message: message.error,
      detail: '/r' + error
    });
  })
    .on('checking-for-update', function (e) {
      return dialog.showMessageBox(mainWindow, {
        type: 'info',
        icon: appIcon,
        buttons: ['OK'],
        title: appName,
        message: message.checking
      });
    })
    .on('update-available', function (e) {
      var downloadConfirmation = dialog.showMessageBox(mainWindow, {
        type: 'info',
        icon: appIcon,
        buttons: ['OK'],
        title: appName,
        message: message.updateAva
      });
      if (downloadConfirmation === 0) {
        return;
      }
    })
    .on('update-not-available', function (e) {
      return dialog.showMessageBox(mainWindow, {
        type: 'info',
        icon: appIcon,
        buttons: ['OK'],
        title: appName,
        message: message.updateNotAva
      });
    })
    .on('update-downloaded', function (event, releaseNotes, releaseName, releaseDate, updateUrl, quitAndUpdate) {
      var index = dialog.showMessageBox(mainWindow, {
        type: 'info',
        icon: appIcon,
        buttons: ['现在重启', '稍后重启'],
        title: appName,
        message: message.downloaded,
        detail: releaseName + "/n/n" + releaseNotes
      });
      if (index === 1) return;
      force_quit = true;
      autoUpdater.quitAndInstall();
    });
}

function updateHandle() {
  // ipc.on('check-for-update', function (event, arg) {
    autoUpdater.checkForUpdates();
  // });
}