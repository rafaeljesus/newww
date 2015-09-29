var bole = require('bole');
var clf = require('../lib/utils').toCommonLogFormat;
var emitter = require('../adapters/metrics')();
var logger = bole('EXTERNAL');
var Request = require('request');
var VError = require('verror');

var externalRequest = function externalRequest(opts, cb) {

  var start = Date.now();
  Request(opts, function(err, resp, body) {

    if (resp) {
      var hostname = '';
      if (resp.request && resp.request.uri && resp.request.uri.host) {
        if (process.env.REMOTE_DEV) {
          hostname = resp.request.uri.host.replace('.internal.npmjs.dev', '');
        } else {
          hostname = resp.request.uri.host.replace('.internal.npmjs.com', '');
        }
      }

      var latency = Date.now() - start;
      emitter.metric({
        name: 'latency.external',
        value: latency,
        source: hostname
      });

      logger.info(clf(resp, latency));
    }

    if (err) {
      logger.error(body); // get more info about the error
      logger.error(err);
    }

    return cb(decorateError(err), resp, body);
  });

  function decorateError(err) {
    if (!err) return err;
    var e = new VError(err, "Can't access '%s'", opts.url);

    // Copy any added error properties
    Object.keys(err).forEach(function(k) {
      e[k] = err[k];
    });

    return e;
  }
};

externalRequest.get = function(opts, cb) {
  opts.method = 'get';
  return externalRequest(opts, cb);
};

externalRequest.post = function(opts, cb) {
  opts.method = 'post';
  return externalRequest(opts, cb);
};

externalRequest.put = function(opts, cb) {
  opts.method = 'put';
  return externalRequest(opts, cb);
};

externalRequest.del = function(opts, cb) {
  opts.method = 'delete';
  return externalRequest(opts, cb);
};

externalRequest.logger = logger;

module.exports = externalRequest;
