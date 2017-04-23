/**
 * Created by XiaMi on 2017/4/19.
 */

var utils = require('utils');

var webpage = require('casper').create({
  //verbose: true,
  logLevel: 'debug',
  viewportSize: {
    width: 1024,
    height: 768
  },
  pageSettings: {
    loadImages: true,
    loadPlugins: true,
    XSSAuditingEnabled: true
  }
});

//打开页面
webpage.start()
  .thenOpen('https://passport.bilibili.com/captcha', function (res) {
    this.echo('打印页面信息');
    res.body = '';//不打印body信息
    utils.dump(res);
    this.captureSelector('passport.png', 'img');
  })
  .then(function exit() {
    this.echo('执行完成，退出');
    this.exit();
  })
  .run();
