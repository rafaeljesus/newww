var P = require('bluebird');
var redis = require('redis');

P.promisifyAll(redis.RedisClient.prototype);

module.exports = P.promisifyAll(require('generic-pool').Pool({
  name: 'redis',
  max: 10,
  min: 1,
  idleTimeoutMillis: 30000,
  create: function(cb) {
    var client = redis.createClient(process.env.REDIS_URL);
    client.on('connect', function() {
      client.removeListener('error', cb);
      cb(null, client);
    });

    client.on('error', cb);
  },
  destroy: function(client) {
    client.end();
  }
}));

module.exports.withConnection = function(liftedFn) {
  var redisP = this.acquireAsync();
  return redisP.then(conn => {
    return redisP.then(liftedFn).finally(x => this.release(conn))
  });
};
