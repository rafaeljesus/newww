var
    _       = require('lodash'),
    assert  = require('assert'),
    bole    = require('bole'),
    crypto  = require('crypto'),
    P       = require('bluebird'),
    Redis   = require('redis-url'),
    Request = require('../lib/external-request');

var redis, DEFAULT_TTL, KEY_PREFIX, options;
var DEFAULT_TTL = 300; // seconds
var KEY_PREFIX = 'cache:';
var logger = bole('cache');

var Cache = {};

Cache.configure = function configure(opts)
{
    assert(_.isObject(opts), 'you must pass an options object to the cache configuration');
    assert(_.isString(opts.redis), 'you must pass a redis url in `options.redis`');

    redis = Redis.connect(opts.redis);

    redis.on('error', function (err)
    {
        logger.error('cache redis connection lost; reconnecting');
        logger.error(err);
    });

    if (opts.ttl)  { DEFAULT_TTL = opts.ttl; }
    if (opts.prefix) { KEY_PREFIX = opts.prefix; }

    options = opts;

    // for testing convenience only
    Cache.redis = redis;
    Cache.DEFAULT_TTL = DEFAULT_TTL;
    Cache.KEY_PREFIX = KEY_PREFIX;
    Cache.logger = logger;
};

Cache.disconnect = function disconnect()
{
    if (redis) {
        redis.quit();
        Cache.redis = redis = null;
    }

    options = null;
    DEFAULT_TTL = 300; // seconds
    KEY_PREFIX = 'cache:';
};

Cache._fingerprint = function _fingerprint(obj)
{
    var cleaned = {};
    var keys = Object.keys(obj).sort();
    _.each(keys, function(k) { k = k.toLowerCase(); cleaned[k] = obj[k]; });
    if (cleaned.method)
    {
        cleaned.method = cleaned.method.toLowerCase();
    }
    delete cleaned.ttl;

    var hash = crypto
        .createHash('md5')
        .update(JSON.stringify(cleaned))
        .digest('hex');
    return KEY_PREFIX + hash;
};

function safeparse(input)
{
    try { return JSON.parse(input); }
    catch(ex) { return null; }
}

Cache.drop = function drop(opts, callback)
{
    if (process.env.USE_CACHE !== 'true')
    {
        return process.nextTick(callback);
    }

    assert(_.isObject(opts), 'you must pass a Request-ready options object to cache.drop()');

    var key = Cache._fingerprint(opts);
    Cache.dropKey(key, callback);
};

Cache._getNoCache = function _getNoCache(opts, callback)
{
    assert(_.isObject(opts), 'you must pass a Request-ready options object to cache.get()');

    Request(opts, function(err, response, data)
    {
        if (err) { return callback(err); }
        if (response.statusCode !== 200)
        {
            var e = new Error('unexpected status code ' + response.statusCode);
            e.statusCode = response.statusCode;
            return callback(e);
        }
        callback(null, data);
    });
};

Cache.get = function get(opts, callback)
{
    if (process.env.USE_CACHE !== 'true')
    {
        return Cache._getNoCache(opts, callback);
    }

    assert(_.isObject(opts), 'you must pass a Request-ready options object to cache.get()');

    var key = Cache._fingerprint(opts);
    Cache.getKey(key, function(err, value)
    {
        if (err)
        {
            Cache.logger.error('problem getting ' + key + ' from redis @ ' + options.redis);
            Cache.logger.error(err);
        }
        else if (value)
        {
            value = safeparse(value);
        }

        if (value)
        {
            return callback(null, value);
        }

        Cache.logger.info('get: ' + opts.url);

        Request(opts, function(err, response, data)
        {
            if (err) { return callback(err); }
            if (response.statusCode !== 200)
            {
                var e = new Error('unexpected status code ' + response.statusCode);
                e.statusCode = response.statusCode;
                return callback(e);
            }

            var ttl = opts.ttl || DEFAULT_TTL;
            Cache.setKey(key, ttl, JSON.stringify(data));
            callback(null, data);
        });
    });
};

Cache.setKey = function setKey(key, ttl, data, callback)
{
    if (process.env.USE_CACHE !== 'true')
    {
        if (callback) { process.nextTick(callback()); }
        return;
    }

    assert(_.isObject(redis), 'you must configure the redis client before using the cache.');

    redis.setex(key, ttl, data, function(err, unused)
    {
        if (err)
        {
            Cache.logger.error('unable to cache ' + key + ' in redis @ ' + options.redis);
            Cache.logger.error(err);
        }
        else
        {
          Cache.logger.info('cached ' + key);
        }

        if (callback) { callback(err, unused); }
    });
};

Cache.getKey = function getKey(key, callback)
{
    if (process.env.USE_CACHE !== 'true')
    {
        return process.nextTick(callback());
    }

    assert(_.isObject(redis), 'you must configure the redis client before using the cache.');
    redis.get(key, callback);
};

Cache.dropKey = function dropKey(key, callback)
{
    if (process.env.USE_CACHE !== 'true')
    {
        if (callback) { process.nextTick(callback()); }
    }

    redis.del(key, function(err)
    {
        if (err)
        {
            Cache.logger.error('problem deleting ' + key + ' from redis @ ' + options.redis);
            Cache.logger.error(err);
        }
        if (callback) { callback(); }
    });
};

// promisified editions

Cache.getP = function getP(opts)
{
    var deferred = P.defer();

    Cache.get(opts, function(err, result)
    {
        if (err) { return deferred.reject(err); }
        deferred.resolve(result);
    });

    return deferred.promise;
};

Cache.dropP = function dropP(opts)
{
    var deferred = P.defer();
    Cache.drop(opts, function() { deferred.resolve(); });
    return deferred.promise;
};

module.exports = Cache;
