/**
 * Created by XiaMi on 2017/5/11.
 */
var global = require('./global_variables');
var webpage = require('webpage');
var page = webpage.create();
var tool = require('../shellLib/tool');

var system = require('system');
var args = system.args;

var contributions = JSON.parse(args[1]);

const loggedCookie = tool.fileRead(global.LOGINED_COOKIE_JAR);

if (loggedCookie) {
  Array.prototype.forEach.call(loggedCookie, function(x) {
    phantom.addCookie(x);
  });
}

page.open(global.URL_ARTICLE, function(status) {
  if (status !== 'success') {
    console.error('检查稿件是否已经存在失败!');
    phantom.exit();
  } else {
    console.log('检查稿件是否已经存在');

    //主要判断月份是否一致
    var injectStatus = page.injectJs(page.libraryPath + global.DIR_JQUERY);

    if (!injectStatus) {
      console.error('载入jquery失败');
      phantom.exit();
    } else {
      contributions.forEach(function(contribution, index) {
        checkContributions(contribution, index);
      });
    }
  }
});


function checkContributions(contribution, index) {
    setTimeout(function() {
      console.log('搜索稿件:' + contribution);
      page.evaluate(function(contribution) {
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

        var $searchInput = $('.search-wrp input[type=text]');
        $searchInput.val('录像 ' + contribution).trigger2('input').focus();

      }, contribution);

      page.sendEvent('keypress', page.event.key.Enter);

      setTimeout(function() {
        var exist = page.evaluate(function () {
          if ($('.info-wrp .text').text().indexOf('获取稿件失败') > -1) {
            console.log('搜索同名稿件失败');
            checkContributions(contribution, 0);
            return -1;
          } else {
            return $('.article-card').length;
          }
        });

        if (exist > -1) {
          console.log('out_data:CONTRIBUTION_CHECKED|' + JSON.stringify({
              contribution: contribution,
              exist: !!exist
            }));

          page.render('screenshots/exist-' + index + '.png');
        } else {
          page.render('screenshots/exist-' + index + '-error.png');
        }
      }, 1000);
    }, index * 1500);
}
