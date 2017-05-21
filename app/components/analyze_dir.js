/**
 * Created by XiaMi on 2017/5/21.
 */

var fs = require('fs');

const analyzeDir = {
  getAllFiles: function(root) {
    var res = [];
    var files = fs.readdirSync(root);

    files.forEach(function(file) {
      var pathname = root + '/' + file;
      var stat = fs.lstatSync(pathname);

      if (!stat.isDirectory()) {
        res.push({
          pathname: pathname,
          filename: file
        });
      }
    });
    return res;
  },
  getFileSize: function(path) {
    var states = fs.statSync(path);

    // obj.size = states.size;//文件大小，以字节为单位
    // obj.name = file;//文件名
    // obj.path = path+'/'+file; //文件绝对路径

    return states.size;
  }
};

module.exports = analyzeDir;
