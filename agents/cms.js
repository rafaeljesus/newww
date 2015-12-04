/* Caching is tricky, and so deserves explanation.
 *
 * This is currently specific to the CMS, though most of the specifics are
 * factored separately.
 *
 * The general principles are thus: if we have it in cache, serve it up, even
 * if it's stale. If there's stale data in the cache, update it for future
 * requests. Don't hammer the backend if it's stale. We only have to fetch it
 * once.
 */
var P = require('bluebird');
var url = require('url');
var fetch = require('node-fetch');
fetch.Promise = P;

var redis = require('redis');
P.promisifyAll(redis.RedisClient.prototype);

var bole = require('bole');
var logger = bole("CMS");

var debug = require('debuglog')('newww:cms');

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

/**
 * name: the cache name, for namespacing redis keys
 * fn: the function to cache
 * ttl: the cache time in seconds
 */
function Cache(name, fn, ttl) {
  this.pending = {};
  this.fn = fn;
  this.name = name;
  this.ttl = ttl;
}

Cache.prototype.get = function(key) {
  var cache = this;
  var cacheKey = cache.name + ":" + key;
  return withRedis(function(redis) {
    debug("checking for %j in cache", key);
    return redis.getAsync(cacheKey).then(JSON.parse)
  }).then(function(cached) {
    if (!cached) {
      debug("%j is not in cache, fetching", key);
      return cache.fetch(key);
    } else {
      debug("%j is in cache.", key);
      cached.fetchedFromCacheAt = Date.now();

      var freshAfter = Date.now() - cache.ttl * 1000;
      if (cached.fetchedAt < freshAfter) {
        debug("Freshening %j because content fetched at %j is older than %j", key, cached.fetchedAt, freshAfter);
        cache.fetch(key).catch(function(err) {
          if (err.statusCode == 404) {
            debug("Deleting %j from cache", key);
            return withRedis(function(redis) {
              return redis.delAsync(cacheKey);
            });
          } else {
            throw err;
          }
        }).catch(function(err) {
          logger.error(err);
        });
      }

      return cached;
    }
  });

};

Cache.prototype.fetch = function(key) {
  var cache = this;
  var cacheKey = cache.name + ":" + key;
  if (!cache.pending[key]) {
    debug("no request for %j is pending, starting one", key);
    cache.pending[key] = P.resolve(cache.fn(key)).finally(function() {
      debug("Removing pending request for %j", key);
      delete cache.pending[key]
    }).tap(function(value) {
      return withRedis(function(redis) {
        debug("Got fresh content for %j, storing to cache", key);
        return redis.setAsync(cacheKey, JSON.stringify(value));
      }).then(function() {
        debug("Content for %j is now in cache", key);
      }).catch(function(err) {
        debug("Error %j", err.message);
        logger.error(err);
        return value;
      });
    });
  } else {
    debug("Request for %j is already pending", key);
  }

  return cache.pending[key];
};

function withRedis(liftedFn) {
  var redisP = pool.acquireAsync();
  return redisP.then(function(conn) {
    return redisP.then(liftedFn).finally(function() {
      pool.release(conn);
    });
  });
}

var cache = new Cache('content', fetchPage, process.env.CMS_CACHE_TIME || 30 * 60);

function fetchPage(slug) {
  var pageRoot = url.resolve(process.env.CMS_API, 'pages/');
  var pageUrl = url.resolve(pageRoot, slug);
  debug("Fetching %j for %j", pageUrl, slug);
  return fetch(pageUrl).then(function(res) {
    if (res.status >= 300) {
      var err = new Error("Bad status: " + res.status);
      err.statusCode = res.status;
      throw err;
    }
    return res.json()
  }).then(function(page) {
    debug("Got content for %j: %j", slug, page);
    if (typeof page != 'object' || !page.id || !page.html || !page.title) {
      throw new Error("Invalid page returned");
    }
    return page;
  }).then(function addMarker(json) {
    json.fetchedAt = Date.now();
    return json;
  });
}

module.exports = function getPage(slug) {
  return cache.get(slug);
};
