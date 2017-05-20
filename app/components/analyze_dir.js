/**
 * Created by XiaMi on 2017/5/21.
 */

var fs = require('fs');

const analyzeDir = {
  getAllFiles: function(root) {
    var res = [] , files = fs.readdirSync(root);
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
  }
};

module.exports = analyzeDir;
