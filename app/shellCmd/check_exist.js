/**
 * Created by XiaMi on 2017/5/20.
 */

var global = require('./global_variables');
var tool = require('../shellLib/tool');

var webpage = require('webpage');
var page = webpage.create();


const loggedCookie = tool.fileRead(global.LOGINED_COOKIE_JAR);

if (loggedCookie) {
  Array.prototype.forEach.call(loggedCookie, function(x) {
    phantom.addCookie(x);
  });
}

page.open(global.URL_ARTICLE, function(status) {
  if (status !== 'success') {
    console.error('自动上传开始失败!');
    phantom.exit();
  } else {
    console.log('检查稿件是否已经存在');

    //主要判断月份是否一致
    var injectStatus = page.injectJs(page.libraryPath + global.DIR_JQUERY);

    if (!injectStatus) {
      console.error('载入jquery失败');
      phantom.exit();
    } else {
    }
  }
});
