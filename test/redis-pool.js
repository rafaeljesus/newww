var Code = require('code'),
  Lab = require('lab'),
  lab = exports.lab = Lab.script(),
  describe = lab.experiment,
  before = lab.before,
  after = lab.after,
  it = lab.test,
  expect = Code.expect,
  RedisPool = require('../lib/redis-pool'),
  getRandomPort = require('./helpers/redis.js').randomPort,
  spawnRedis = require('./helpers/redis.js').spawnRedis;

describe('lib/redis-pool.js', function() {
  describe('pooling', function() {
    it('round-robins between instances', function(done) {
      var ports = [getRandomPort(), getRandomPort()];
      var processes = ports.map(spawnRedis);
      var client = new RedisPool(ports.map(function (port) {
        return { port: port };
      }));

      var seen = [];
      for (var i = 0; i < ports.length; i++) {
        client.config('get', 'port', function (err, result) {
          seen.push(parseInt(result[1], 10));
          if (seen.length === ports.length) {
            // `sort` is not friendly to Numbers but it doesn't matter here.
            expect(ports.sort()).to.deep.equal(seen.sort());
            done();
          }
        });
      }
    });
  });
});
