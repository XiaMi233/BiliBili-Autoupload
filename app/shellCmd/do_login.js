/**
 * Created by XiaMi on 2017/5/11.
 */
var global = require('./global_variables');
var webpage = require('webpage');
var page = webpage.create();//创建webpage对象

var fs = require('fs');

var system = require('system');
var args = system.args;

var loginInfo = {
  userId: args[1],
  pwd: args[2],
  vdcode: args[3]
};

page.onUrlChanged = function(targetUrl) {
  // page.close();
  // phantom.exit();
};

if(fs.isFile(global.LOGIN_COOKIE_JAR)) {
  Array.prototype.forEach.call(JSON.parse(fs.read(global.LOGIN_COOKIE_JAR)), function(x) {
    phantom.addCookie(x);
  });
}

page.open('https://passport.bilibili.com/login', function(status) {
  if (status !== 'success') {
    console.error('进入登录页面失败!');
    phantom.exit();
  } else {
    console.log('进入登录页面!');
    var injectStatus = page.injectJs(page.libraryPath + global.DIR_JQUERY);

    if (!injectStatus) {
      console.error('载入jquery失败');
      phantom.exit()
    } else {
      setTimeout(function() {

        var cookies = page.cookies;

        console.log('Listing cookies:');
        for(var i in cookies) {
          console.log(cookies[i].name + '=' + cookies[i].value);
        }

        page.evaluate(function (loginInfo) {
          console.log(loginInfo);

          $('input[name=userid]').val('fdcsd6616@gmail.com');
          $('input[name=pwd]').val('fdcsd6616-');
          // $('input[name=userid]').val(loginInfo.userId);
          // $('input[name=pwd]').val(loginInfo.pwd);
          $('input[name=vdcode]').val(loginInfo.vdcode);

          $('.login').click();

        }, loginInfo);
      }, 1000);

      setTimeout(function() {
        fs.write(global.LOGINED_COOKIE_JAR, JSON.stringify(phantom.cookies), "w");
        page.render('doLogin.png');
        phantom.exit();
      }, 5000);
    }
  }
});


