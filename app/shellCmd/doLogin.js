/**
 * Created by XiaMi on 2017/5/11.
 */

var webpage = require('webpage');
var page = webpage.create();//创建webpage对象

var system = require('system');
var args = system.args;
// var userId = args[1];
// var pwd = args[2];
// var vdcode = args[3];

var loginInfo = {
  userId: args[1],
  pwd: args[2],
  vdcode: args[3]
};

var fs = require('fs');
var CookieJar = 'cookiejar.json';


page.onUrlChanged = function(targetUrl) {
  // page.close();
  // phantom.exit();
};

if(fs.isFile(CookieJar)) {
  Array.prototype.forEach.call(JSON.parse(fs.read(CookieJar)), function(x) {
    phantom.addCookie(x);
  });
}

page.open('https://passport.bilibili.com/login', function(status) {
  if (status !== 'success') {
    console.log('Fail to load the page!');
    phantom.exit();
  } else {
    console.log('进入登录页面');
    var injectStatus = page.injectJs(page.libraryPath + '/../lib/jquery-1.11.3.min.js');

    if (injectStatus) {
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
        page.render('doLogin.png');
        phantom.exit();
      }, 2000);
    } else {
      console.log('载入jquery失败');
      phantom.exit()
    }

  }
});


