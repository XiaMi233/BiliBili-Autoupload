/**
 * Created by XiaMi on 2017/5/11.
 */
var global = require('./global_variables');
var webpage = require('webpage');
var page = webpage.create();
var tool = require('../shellLib/tool');

var system = require('system');
var args = system.args;

var loginInfo = {
  userId: args[1],
  pwd: args[2],
  vdcode: args[3]
};
var LOGIN_STATUS = false;

page.onUrlChanged = function(targetUrl) {
  // page.close();
  // phantom.exit();
};

const loginCookie = tool.fileRead(global.LOGIN_COOKIE_JAR);

if (loginCookie) {
  Array.prototype.forEach.call(loginCookie, function(x) {
    phantom.addCookie(x);
  });
}

page.open(global.URL_LOGIN, function(status) {
  if (status !== 'success') {
    console.error('进入登录页面失败!');
    phantom.exit();
  } else {
    console.log('开始登录');
    var injectStatus = page.injectJs(page.libraryPath + global.DIR_JQUERY);

    if (!injectStatus) {
      console.error('载入jquery失败');
      phantom.exit();
    } else {
      setTimeout(function() {
        page.onUrlChanged = function(targetUrl) {
          LOGIN_STATUS = true;
          //about:blank
          // page.close();
          // phantom.exit();
        };

        // page.onNavigationRequested = function(targetUrl) {
        //   //基本判断登录失败
        //   console.log('登录失败判断');
        //   if (targetUrl === 'about:blank') {
        //     console.log('out_data:LOGIN_ERROR');
        //     clearTimeout(successTimer);
        //     page.close();
        //     phantom.exit();
        //   }
        // }

        page.evaluate(function (loginInfo) {
          console.log(loginInfo);

          $.fn.trigger2 = function(eventName) {
            return this.each(function() {
              var el = $(this).get(0);
              triggerNativeEvent(el, eventName);
            });
          };

          function triggerNativeEvent(el, eventName){
            if (el.fireEvent) { // < IE9
              (el.fireEvent('on' + eventName));
            } else {
              var evt = document.createEvent('Events');
              evt.initEvent(eventName, true, false);
              el.dispatchEvent(evt);
            }
          }

          // $('.form-login .username input[type=text]').val('fdcsd6616@gmail.com').trigger2('input');
          // $('.form-login .password input[type=password]').val('fdcsd6616-').trigger2('input');
          $('.form-login .username input[type=text]').val(loginInfo.userId).trigger2('input');
          $('.form-login .password input[type=password]').val(loginInfo.pwd).trigger2('input');
          $('.form-login .vdcode input[type=text]').val(loginInfo.vdcode).trigger2('input');

          $('.form-login .btn-login')[0].click();

        }, loginInfo);
      }, 1000);

      setTimeout(function() {
        if (LOGIN_STATUS) {
          tool.fileWrite(global.LOGINED_COOKIE_JAR, phantom.cookies);
          console.log('out_data:LOGIN_SUCCESS');
          page.render('screenshots/login_success.png');
        } else {
          var errorMsg = page.evaluate(function () {
            var errorMsg = [];
            $('.form-login .tips').map(function(index, tip) {
              errorMsg.push($(tip).text());
            });

            return errorMsg;
          });
          console.log('out_data:LOGIN_ERROR|' + JSON.stringify(errorMsg));
        }
        phantom.exit();
      }, 3000);
    }
  }
});


