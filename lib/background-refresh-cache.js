/* Caching is tricky, and so deserves explanation.
 *
 * The general principles are thus: if we have it in cache, serve it up, even
 * if it's stale. If there's stale data in the cache, update it for future
 * requests. Don't hammer the backend if it's stale. We only have to fetch it
 * once.
 */
var P = require('bluebird');

var bole = require('bole');
var logger = bole("background-refresh-cache");
var debug = require('debuglog')('newww:background-refresh-cache');

var pool = require('./redis-pool');

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
  return pool.withConnection(function(redis) {
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
            return pool.withConnection(function(redis) {
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
  var cacheKey = cache.name + ":" + String(key);
  if (!cache.pending[key]) {
    debug("no request for %j is pending, starting one", key);
    cache.pending[key] = P.resolve(cache.fn(key)).finally(function() {
      debug("Removing pending request for %j", key);
      delete cache.pending[key]
    }).tap(function(value) {
      return pool.withConnection(function(redis) {
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

module.exports = Cache;
