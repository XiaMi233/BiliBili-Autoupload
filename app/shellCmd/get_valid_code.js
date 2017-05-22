/**
 * Created by XiaMi on 2017/4/17.
 */
var global = require('./global_variables');
var fs = require('fs');
var tool = require('../shellLib/tool');

var webpage = require('webpage');
var page = webpage.create();

const loggedCookie = tool.fileRead(global.LOGINED_COOKIE_JAR);

if (loggedCookie) {
  Array.prototype.forEach.call(loggedCookie, function(x) {
    phantom.addCookie(x);
  });
}

getValidCode();

function getValidCode() {
  var page = webpage.create();

  page.onResourceReceived = function(response) {
    fs.write(global.LOGIN_COOKIE_JAR, JSON.stringify(phantom.cookies), "w");
  };

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
