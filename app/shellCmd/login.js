/**
 * Created by XiaMi on 2017/4/17.
 */

var Tesseract = require('tesseract.js');
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
  .thenOpen('https://passport.bilibili.com/login', function openMeizu(res) {
    // .thenOpen('http://member.bilibili.com/v/video/submit.html', function openMeizu(res) {
    this.echo('打印页面信息');
    res.body = '';//不打印body信息
    utils.dump(res);

    this.click("#vdCodeTxt");

    this.wait(2000, function() {
      // this.captureSelector('passport.png', '#captchaImg');
      console.log(1);
      // console.log(__dirname);
      Tesseract.recognize('https://passport.bilibili.com/captcha')
        .then(function(result){
          console.log(result)
        });
      console.log(3);

      this.capture('bilibili_login.png');
    });

    // this.capture('bilibili_upload_page.png');
    //点击登录按钮
    // if (this.exists("#_unlogin")) {
    //   this.echo('点击登录按钮');
    //   this.click("#_unlogin a:nth-child(1)");
    //   this.wait(3000, function wait3s_1() {
    //     if (this.exists("form#mainForm")) {
    //       this.echo("需要登陆，填充账号信息。。。");
    //       //填充表单账号
    //       this.fill('form#mainForm', {
    //         'account': 'lzwy0820@flyme.cn',
    //         'password': '********'
    //       }, true);
    //       this.capture('meizu_login_page.png');
    //       this.wait(3000, function wait3s_2() {
    //         //登录按钮存在，点击
    //         if (this.exists("#login")) {
    //           this.echo('提交登录');
    //           this.click("#login");
    //         }
    //       });
    //     }
    //   });
    // }
  })
  // .then(function capture() {
  //   if (this.exists('#mzCustName')) {
  //     this.echo('登录成功！开始截图存储..');
  //   } else {
  //     this.echo('登录失败！请查看截图文件')
  //   }
  //   //截图
  //   this.capture('meizu.png');
  //   this.captureSelector('meizu_header.png', 'div.meizu-header');
  // })
  .then(function exit() {
    this.echo('执行完成，退出');
    this.exit();
  })
  .run();
