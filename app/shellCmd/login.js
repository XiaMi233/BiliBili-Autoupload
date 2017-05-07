/**
 * Created by XiaMi on 2017/4/17.
 */
var webpage = require('webpage');
var page = webpage.create();//创建webpage对象

var fs = require('fs');
var CookieJar = "cookiejar.json";

page.onUrlChanged = function(targetUrl) {
  console.log('out_data:NO_LOGIN');
  page.close();
  login();
};

page.onResourceReceived = function(response) {
  fs.write(CookieJar, JSON.stringify(phantom.cookies), "w");
};

if(fs.isFile(CookieJar)) {
  Array.prototype.forEach.call(JSON.parse(fs.read(CookieJar)), function(x){
    phantom.addCookie(x);
  });
}


// page.open('https://passport.bilibili.com/login', function(status) {
page.open('http://member.bilibili.com/v/video/submit.html', function(status) {

});

// page.open('http://member.bilibili.com/v/video/submit.html', function(status) {
//   // this assumes that when you are not logged in, the server replies with a 303
//   console.log(JSON.stringify(pageResponses['http://space.bilibili.com/ajax/member/MyInfo']));
//   if(pageResponses['http://member.bilibili.com/x/web/archive/pre'] == 302) {
//     console.log('not logged');
//     //attempt login
//     //assuming a resourceRequested event is fired the cookies will be written to the jar and on your next load of the script they will be found and used
//   } else {
//     console.log('logged');
//   }
// });

function login() {
  var page = webpage.create();

  // page.onLoadFinished =
  // };

  page.open('https://passport.bilibili.com/login', function(status) {
    if (status !== 'success') {
      console.log('Fail to load the page!');
      phantom.exit();
    } else {
      console.log('进入登录页面');
      var injectStatus = page.injectJs(page.libraryPath + '/../lib/jquery-1.11.3.min.js');

      var imgObj = page.evaluate(function () {
        $("#vdCodeTxt").val(123).focus().click();

        var $captchaImg = $('#captchaImg');
        var offset = $captchaImg.offset();
        var height = $captchaImg.height();
        var width = $captchaImg.width();

        // console.log(1);
        return {
          top: offset.top,
          left: offset.left,
          height: height,
          width: width
        };
      });
      console.log('获取验证码位置高度：' + JSON.stringify(imgObj));
      // page.clipRect = { top: 0, left: 0, width: 1024, height: 768 };
      setTimeout(function () {
        console.log('获取验证码');
        page.render('all.png');
        page.clipRect = imgObj;
        page.render('test.png');
        // console.log(injectStatus);
        phantom.exit()
      }, 2000);
    }
  });
}
