/**
 * Created by XiaMi on 2017/4/17.
 */

var page = require('webpage').create();//创建webpage对象
var sys = require('system');//创建system对象


page.open('https://passport.bilibili.com/login', function(status) {
  if (status !== 'success') {
    console.log('Fail to load the page!');
    phantom.exit();
  } else {
    page.injectJs(page.libraryPath + '/../lib/jquery.js');
    // page.injectJs(page.libraryPath + '/../lib/jquery.js', function() {
    //   page.evaluate(function() {
    //     $("button").click();
    //   });
    //   phantom.exit()
    // });
    page.render('test.png');
    phantom.exit()
  }
});
