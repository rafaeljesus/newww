var _ = require('lodash'),
  assert = require('assert'),
  bole = require('bole'),
  crypto = require('crypto'),
  P = require('bluebird'),
  Redis = require('redis'),
  Request = require('../lib/external-request'),
  debug = require('debuglog')('newww:cache'),
  safeparse = require('../lib/utils').safeJsonParse;
var VError = require('verror');

var redis, DEFAULT_TTL, KEY_PREFIX, options;
var DEFAULT_TTL = 300; // seconds
var KEY_PREFIX = 'cache:';
var logger = bole('cache');

var Cache = {};

Cache.configure = function configure(opts) {
  assert(_.isObject(opts), 'you must pass an options object to the cache configuration');
  assert(_.isString(opts.redis), 'you must pass a redis url in `options.redis`');

  redis = Redis.createClient(opts.redis);

  redis.on('error', function(err) {
    logger.error('cache redis connection lost; reconnecting');
    logger.error(err);
  });

  if (opts.ttl) {
    DEFAULT_TTL = opts.ttl;
  }
  if (opts.prefix) {
    KEY_PREFIX = opts.prefix;
  }

  options = opts;

  // for testing convenience only
  Cache.redis = redis;
  Cache.DEFAULT_TTL = DEFAULT_TTL;
  Cache.KEY_PREFIX = KEY_PREFIX;
  Cache.logger = logger;
};

Cache.disconnect = function disconnect() {
  if (redis) {
    redis.quit();
    Cache.redis = redis = null;
  }

  options = null;
  DEFAULT_TTL = 300; // seconds
  KEY_PREFIX = 'cache:';
};

Cache._cleanObj = function _cleanObj(obj) {
  var cleaned = {};
  var keys = Object.keys(obj).sort();
  _.each(keys, function(k) {
    k = k.toLowerCase();
    cleaned[k] = obj[k];
  });
  if (cleaned.method) {
    cleaned.method = cleaned.method.toLowerCase();
  }
  delete cleaned.ttl;

  return JSON.stringify(cleaned);
};

Cache._fingerprint = function _fingerprint(key) {
  if (!_.isString(key)) {
    key = this._cleanObj(key);
  }

  var hash = crypto
    .createHash('md5')
    .update(key)
    .digest('hex');

  debug("Cache._fingerprint(%j) -> %j", key, KEY_PREFIX + hash);

  return KEY_PREFIX + hash;
};

Cache.drop = function drop(opts, callback) {
  debug("Cache.drop(%j)", opts);
  if (process.env.USE_CACHE !== 'true') {
    return callback();
  }

  assert(_.isObject(opts), 'you must pass a Request-ready options object to cache.drop()');

  var key = Cache._fingerprint(opts);
  Cache.dropKey(key, callback);
};

Cache._getNoCache = function _getNoCache(opts, callback) {
  assert(_.isObject(opts), 'you must pass a Request-ready options object to cache.get()');

  Request(opts, function(err, response, data) {
    if (err) {
      return callback(err);
    }
    if (response.statusCode !== 200) {
      var e = new VError('unexpected status code "%s" while fetching "%s"', response.statusCode, opts.url);
      e.statusCode = response.statusCode;
      return callback(e);
    }
    callback(null, data);
  });
};

Cache.get = function get(opts, callback) {
  debug("Cache.get(%j)", opts);
  if (process.env.USE_CACHE !== 'true') {
    return Cache._getNoCache(opts, callback);
  }

  assert(_.isObject(opts), 'you must pass a Request-ready options object to cache.get()');

  Cache.getKey(opts, function(err, value) {
    value = safeparse(value);

    if (value) {
      return callback(null, value);
    }

    Cache.logger.debug('get: ' + opts.url);

    Request(opts, function(err, response, data) {
      if (err) {
        return callback(err);
      }
      if (response.statusCode !== 200) {
        var e = new Error('unexpected status code ' + response.statusCode);
        e.statusCode = response.statusCode;
        return callback(e);
      }

      var ttl = opts.ttl || DEFAULT_TTL;
      Cache.setKey(opts, ttl, JSON.stringify(data));
      callback(null, data);
    });
  });
};

Cache.setKey = function setKey(key, ttl, data, callback) {
  debug("Cache.setKey(%j, %s, %j)", key, ttl, data);

  if (process.env.USE_CACHE !== 'true') {
    if (callback) {
      callback();
    }
    return;
  }

  assert(_.isObject(redis), 'you must configure the redis client before using the cache.');
  assert(_.isNumber(ttl), 'you must pass a numeric ttl');

  redis.setex(this._fingerprint(key), ttl, data, function(err, unused) {
    if (err) {
      Cache.logger.error('unable to cache ' + key + ' in redis @ ' + options.redis);
      Cache.logger.error(err);
    } else {
      Cache.logger.debug('cached ' + key);
    }

    if (callback) {
      callback(err, unused);
    }
  });
};

Cache.getKey = function getKey(key, callback) {
  debug("Cache.getKey(%j)", key);
  if (process.env.USE_CACHE !== 'true') {
    callback();
    return;
  }

  var cacheKey = this._fingerprint(key);

  assert(_.isObject(redis), 'you must configure the redis client before using the cache.');
  redis.get(cacheKey, function(err, value) {
    if (err) {
      Cache.logger.error('problem getting ' + cacheKey + ' from redis @ ' + options.redis);
      Cache.logger.error(err);
    } else {
      Cache.logger.debug('retrieved ' + value + ' from ' + cacheKey);
    }

    callback(err, value);
  });
};

Cache.dropKey = function dropKey(key, callback) {
  debug("Cache.dropKey(%j)", key);
  if (process.env.USE_CACHE !== 'true') {
    if (callback) {
      callback();
    }
    return;
  }

  var cacheKey = this._fingerprint(key);

  redis.del(cacheKey, function(err) {
    debug("Dropped %j", cacheKey);
    if (err) {
      debug("Error: %s", err);
      Cache.logger.error('problem deleting ' + key + ' from redis @ ' + options.redis);
      Cache.logger.error(err);
    }
    if (callback) {
      callback(err);
    }
  });
};

// promisified editions

Cache.getP = function getP(opts) {
  var deferred = P.defer();

  Cache.get(opts, function(err, result) {
    if (err) {
      return deferred.reject(err);
    }
    deferred.resolve(result);
  });

  return deferred.promise;
};

Cache.dropP = function dropP(opts) {
  var deferred = P.defer();
  Cache.drop(opts, function() {
    deferred.resolve();
  });
  return deferred.promise;
};

module.exports = Cache;
