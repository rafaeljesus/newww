var Code = require('code'),
  Lab = require('lab'),
  lab = exports.lab = Lab.script(),
  describe = lab.experiment,
  before = lab.before,
  after = lab.after,
  it = lab.test,
  expect = Code.expect,
  spawn = require('child_process').spawn,
  FailoverRedis = require('../lib/failover-redis'),
  sinon = require('sinon');

function getRandomPort() {
  return Math.floor(Math.random() * 4096) + 1024;
}

describe('lib/failover-redis.js', function() {
  describe('constructor', function() {
    
  });

  describe('failover', function() {
    it('uses the write Redis when both Redises are up', function(done) {
      var writePort = getRandomPort();
      var readPort = getRandomPort();
      var writeRedis = spawn('redis-server', ['--port', writePort.toString()]);
      var readRedis = spawn('redis-server', ['--port', readPort.toString()]);

      // Give the Redises some time to get up.
      var client = new FailoverRedis({
        write: 'redis://127.0.0.1:' + writePort,
        read: 'redis://127.0.0.1:' + readPort
      });

      client.on('ready', function() {
        client.config('get', 'port', function(err, result) {
          expect(err).to.not.exist();
          expect(parseInt(result[1], 10)).to.equal(writePort);
          writeRedis.kill('SIGKILL');
          readRedis.kill('SIGKILL');
          done();
        });
      });
    });

    it('uses the read Redis when write Redis is down', function(done) {
      var writePort = getRandomPort();
      var readPort = getRandomPort();
      var writeRedis = spawn('redis-server', ['--port', writePort.toString()]);
      var readRedis = spawn('redis-server', ['--port', readPort.toString()]);

      var client = new FailoverRedis({
        write: 'redis://127.0.0.1:' + writePort,
        read: 'redis://127.0.0.1:' + readPort
      });

      client.on('ready', function() {
        // Kill this one immediately after it connected and processed INFO.
        writeRedis.kill('SIGKILL');

        // Give the Redis some time to die off.
        setTimeout(function() {
          client.config('get', 'port', function(err, result) {
            expect(err).to.not.exist();
            expect(parseInt(result[1], 10)).to.equal(readPort);
            readRedis.kill('SIGKILL');
            done();
          });
        }, 1000);
      });
    });
  });
});
