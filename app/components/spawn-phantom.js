/**
 * Created by XiaMi on 2017/5/21.
 */
var spawn = require('child_process').spawn;

function spawnPhantom(path, childArgs, dispose) {
  var child = spawn(path, childArgs);

  child.stdout.on('data', function (data) {
    console.log('stdout: ' + data);
    if (data.indexOf('out_data:') > -1) {
      data.toString().split('\n').forEach(function(info) {
        if (info.indexOf('out_data:') > -1) {
          dispose(info.replace('out_data:', '').trim());
        }
      });
    }
  });

  child.stderr.on('data', function (data) {
    console.log('stderr: ' + data);
  });

  child.on('close', function (code) {
    console.log('child process exited with code ' + code);
  });
}

module.exports = spawnPhantom;
