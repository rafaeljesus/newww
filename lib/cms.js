var P = require('bluebird');
var url = require('url');
var fetch = require('node-fetch');

var redis = require('redis');
P.promisifyAll(redis.RedisClient.prototype);

var bole = require('bole');
var logger = bole("CMS");

var pool = P.promisifyAll(require('generic-pool').Pool({
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

function Cache(name, fn) {
  this.pending = {};
  this.fn = fn;
  this.name = name;
}

Cache.prototype.get = function(key) {
  var cache = this;
  var cacheKey = cache.name + ":" + key;
  return withRedis(function(redis) {
    return redis.getAsync(cacheKey).then(JSON.parse)
  }).then(function(cached) {
    if (!cached) {
      if (!cache.pending[key]) {
        cache.pending[key] = P.resolve(cache.fn(key)).finally(function() {
          delete cache.pending[key]
        });

        cache.pending[key].tap(function(value) {
          return withRedis(function(redis) {
            return redis.setAsync(cacheKey, JSON.stringify(value));
          });
        }).catch(function(err) {
          logger.error(err);
        });
      }

      return cache.pending[key];
    } else {
      cached.fetchedFromCacheAt = Date.now();
      return cached;
    }
  });

};

function withRedis(lifted) {
  var redisP = pool.acquireAsync();
  return redisP.then(function(conn) {
    return redisP.then(lifted).finally(function() {
      pool.release(conn);
    });
  });
}

var cache = new Cache('content', fetchPage);

function fetchPage(slug) {
  var pageRoot = url.resolve(process.env.CMS_API, 'pages/');
  return P.resolve(fetch(url.resolve(pageRoot, slug))).then(function(res) {
    return res.json()
  }).then(function addMarker(json) {
    json.fetchedAt = Date.now();
    return json;
  });
}

module.exports = function getPage(slug) {
  return cache.get(slug);
};

// TODO
//
// expire things from the cache and re-acquire them, while serving stale for just a little longer
