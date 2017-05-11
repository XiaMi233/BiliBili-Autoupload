/**
 * Created by XiaMi on 2017/5/11.
 */
var webpage = require('webpage');
var page = webpage.create();//创建webpage对象

var fs = require('fs');
var CookieJar = "cookiejar.json";

page.onUrlChanged = function(targetUrl) {
  page.close();
  phantom.exit();
};

if(fs.isFile(CookieJar)) {
  Array.prototype.forEach.call(JSON.parse(fs.read(CookieJar)), function(x){
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

        $("#vdCodeTxt").val(123).focus().click();

        var $captchaImg = $('#captchaImg');
        var offset = $captchaImg.offset();
        var height = $captchaImg.height();
        var width = $captchaImg.width();

        return {
          top: offset.top,
          left: offset.left,
          height: height,
          width: width
        };
      });
  }
});


