var
    _       = require('lodash'),
    assert  = require('assert'),
    bole    = require('bole'),
    crypto  = require('crypto'),
    P       = require('bluebird'),
    Redis   = require('redis-url'),
    Request = require('../lib/external-request');
    ;

var redis, DEFAULT_TTL, KEY_PREFIX, options;
var DEFAULT_TTL = 300; // seconds
var KEY_PREFIX = 'cache:';
var logger = bole('cache');

exports.configure = function configure(opts)
{
    assert(_.isObject(opts), 'you must pass an options object to the cache configuration');
    assert(_.isString(opts.redis), 'you must pass a redis url in `options.redis`');

    redis = Redis.connect(opts.redis);
    if (opts.ttl)  { DEFAULT_TTL = opts.ttl; }
    if (opts.prefix) { KEY_PREFIX = opts.prefix; }

    options = opts;

    // for testing convenience only
    exports.redis = redis;
    exports.DEFAULT_TTL = DEFAULT_TTL;
    exports.KEY_PREFIX = KEY_PREFIX;
    exports.logger = logger;
};

exports.disconnect = function disconnect()
{
    if (redis) {
        redis.quit();
        exports.redis = redis = null;
    }

    options = null;
    DEFAULT_TTL = 300; // seconds
    KEY_PREFIX = 'cache:';
};

exports._fingerprint = function _fingerprint(obj)
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

exports.drop = function drop(opts, callback)
{
    if (process.env.USE_CACHE !== 'true')
    {
        return process.nextTick(callback);
    }

    assert(_.isObject(redis), 'you must configure the redis client before using the cache.');
    assert(_.isObject(opts), 'you must pass a Request-ready options object to cache.drop()');

    var key = exports._fingerprint(opts);
    redis.del(key, function(err)
    {
        if (err)
        {
            exports.logger.error('problem deleting ' + key + ' from redis @ ' + options.redis);
            exports.logger.error(err);
        }
        callback();
    });
};

exports._getNoCache = function _getNoCache(opts, callback)
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

exports.get = function get(opts, callback)
{
    if (process.env.USE_CACHE !== 'true')
    {
        return exports._getNoCache(opts, callback);
    }

    assert(_.isObject(redis), 'you must configure the redis client before using the cache.');
    assert(_.isObject(opts), 'you must pass a Request-ready options object to cache.get()');

    var key = exports._fingerprint(opts);
    redis.get(key, function(err, value)
    {
        if (err)
        {
            exports.logger.error('problem getting ' + key + ' from redis @ ' + options.redis);
            exports.logger.error(err);
        }
        else if (value)
        {
            value = safeparse(value);
        }

        if (value)
        {
            return callback(null, value);
        }

        exports.logger.info('get: ' + opts.url);

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
            redis.setex(key, ttl, JSON.stringify(data), function(err, unused)
            {
                if (err)
                {
                    exports.logger.error('unable to cache ' + key + ' in redis @ ' + options.redis);
                    exports.logger.error(err);
                }
                else
                {
                  exports.logger.info('cached ' + key);
                }
            });

            callback(null, data);
        });
    });
};

// promisified editions

exports.getP = function getP(opts)
{
    var deferred = P.defer();

    exports.get(opts, function(err, result)
    {
        if (err) { return deferred.reject(err); }
        deferred.resolve(result);
    });

    return deferred.promise;
};

exports.dropP = function dropP(opts)
{
    var deferred = P.defer();
    exports.drop(opts, function() { deferred.resolve(); });
    return deferred.promise;
};
