var redis = require('redis');

var RedisPool = module.exports = function (options) {
  if (!Array.isArray(options)) {
    options = [options];
  }

  this.clients = options.map(redis.createClient);
};

Object.keys(redis.RedisClient.prototype).forEach(function(func) {
  RedisPool.prototype[func] = function() {
    var client = this.clients.shift();
    var ret = redis.RedisClient.prototype[func].apply(client, arguments);
    this.clients.push(client);
    return ret;
  };
});

RedisPool.prototype.quit = function() {
  this.clients.forEach(function(client) {
    client.quit();
  });
};
