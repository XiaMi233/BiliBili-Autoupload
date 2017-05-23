const electron = require('electron');
const {ipcMain, dialog, Menu, Tray} = require('electron');
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

function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 600,
    height: 400,
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
  mainWindow.webContents.openDevTools();

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
  if (!fs.existsSync(path.resolve(__dirname, '../menu_setting.ini'))) {
    fs.openSync(path.resolve(__dirname, '../menu_setting.ini'), 'w', '0644');
  }

  fs.readFile(path.resolve(__dirname, '../menu_setting.ini'), (err, data) => {
    if (err) throw err;
    var setting = JSON.parse(data.toString() || "{}");
    setting[settingName] = value;
    fs.writeFile(path.resolve(__dirname, '../menu_setting.ini'), JSON.stringify(setting), callback);
  });
}

function settingRead(callback) {
  if (!fs.existsSync(path.resolve(__dirname, '../menu_setting.ini'))) {
    callback(err, {});
  }

  fs.readFile(path.resolve(__dirname, '../menu_setting.ini'), (err, data) => {
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
