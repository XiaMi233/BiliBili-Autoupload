/**
 * Created by XiaMi on 2017/5/19.
 */

var fs = require('fs');

var tool = {
  fileRead: function(path) {
    if(fs.isFile(path)) {
      return JSON.parse(fs.read(path));
    } else {
      return '';
    }
  },

  fileWrite: function(path, obj) {
      return fs.write(path, JSON.stringify(obj), 'w');
  }
};

module.exports = tool;