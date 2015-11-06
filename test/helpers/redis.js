var spawn = require('child_process').spawn;

exports.spawnRedis = function (port) {
  return spawn('redis-server', ['--port', port.toString()]);
};

exports.randomPort = function () {
  return Math.floor(Math.random() * 4096) + 1024;
};
