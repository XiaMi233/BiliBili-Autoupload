/**
 * Created by XiaMi on 2017/5/14.
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

page.open(global.URL_SUBMIT, function(status) {
  if (status !== 'success') {
    console.error('自动上传开始失败!');
    phantom.exit();
  } else {
    console.log('自动上传开始');

    var injectStatus = page.injectJs(page.libraryPath + global.DIR_JQUERY);


    if (!injectStatus) {
      console.error('载入jquery失败');
      phantom.exit()
    } else {
      //暂时限定同时最大上传数量为30个
      page.uploadFile('.upload-wrp input[type=file]', page.libraryPath + '/../../test.flv');
      page.uploadFile('.upload-wrp input[type=file]', page.libraryPath + '/../../test1.flv');


      console.log('上传开始');
      setInterval(function () {
        var results = page.evaluate(function () {
          var $sortWrps = $('#sortWrp');
          var $uploadInputs = $sortWrps.find('.status-wrp');

          return $uploadInputs.map(function () {
            return this.innerText;
          }).get().join('\r\n');
        });

        page.render('submit.png');
        console.log('上传进度：' + results);
      }, 1000);
    }

    // setTimeout(function () {
    //   console.log('上传文件完成');
    //   page.render('submit.png');
    //   phantom.exit();
    // }, 5000);
  }
});
