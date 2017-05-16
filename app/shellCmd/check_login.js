/**
 * Created by XiaMi on 2017/4/17.
 */
var global = require('./global_variables');
var _ = require('lodash');
var fs = require('fs');

var webpage = require('webpage');
var page = webpage.create();

if(fs.isFile(global.LOGINED_COOKIE_JAR)) {
  Array.prototype.forEach.call(JSON.parse(fs.read(global.LOGINED_COOKIE_JAR)), function(x) {
    phantom.addCookie(x);
  });
}

page.onUrlChanged = function(targetUrl) {

}

page.open(global.URL_SUBMIT, function(status) {
  if (status !== 'success') {
    page.close();
    console.log('检查登录状态:未登录');
    getValidCode();
  } else {
    page.close();
    console.log('检查登录状态:已登录');
    console.log('out_data:LOGGED');
    phantom.exit();
  }
});

function getValidCode() {
  var page = webpage.create();

  page.onResourceReceived = function(response) {
    fs.write(global.LOGIN_COOKIE_JAR, JSON.stringify(phantom.cookies), "w");
  };
  //
  // if(fs.isFile(global.LOGIN_COOKIE_JAR)) {
  //   Array.prototype.forEach.call(JSON.parse(fs.read(global.LOGIN_COOKIE_JAR)), function(x) {
  //     phantom.addCookie(x);
  //   });
  // }


  page.open(global.URL_LOGIN, function(status) {
    if (status !== 'success') {
      console.log('Fail to load the page!');
      phantom.exit();
    } else {
      console.log('进入登录页面');
      var injectStatus = page.injectJs(page.libraryPath + global.DIR_JQUERY);

      if (injectStatus) {
        setTimeout(function () {
          page.evaluate(function () {
            $(".vdcode input[type=text]").focus().click();
          });
        }, 1000);

        setTimeout(function () {
          var imgObj = page.evaluate(function () {
            // $("#vdCodeTxt").val(123).focus().click();

            var $captchaImg = $('.vdcode .captcha');
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
          console.log('获取验证码位置高度：' + JSON.stringify(imgObj));

          // setTimeout(function () {
          console.log('获取验证码');
          page.render('all.png');
          page.clipRect = imgObj;
          page.render('v_code.png');
          // console.log(injectStatus);
          console.log('out_data:NO_LOGIN');
          phantom.exit();
        }, 2000);
      } else {
        console.log('jquery载入失败');
        phantom.exit();
      }
    }
  });
}
