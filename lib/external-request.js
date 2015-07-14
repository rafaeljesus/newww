var bole = require('bole');
var clf = require('../lib/utils').toCommonLogFormat;
var emitter = require('../adapters/metrics')();
var logger = bole('EXTERNAL');
var Request = require('request');

var externalRequest = function externalRequest (opts, cb) {

  var start = Date.now();
  Request(opts, function (err, resp, body) {

    if (resp) {
      var hostname = '';
      if (resp.request && resp.request.uri && resp.request.uri.host) {
        if (process.env.NODE_ENV === 'dev') {
          hostname = resp.request.uri.host.replace('.internal.npmjs.dev', '');
        } else {
          hostname = resp.request.uri.host.replace('.internal.npmjs.com', '');
        }
      }
      emitter.metric({
        name: 'latency.external',
        value: Date.now() - start,
        source: hostname
      });

      logger.info(clf(resp));
    }

    if (err) {
      logger.error(body); // get more info about the error
      logger.error(err);
    }

    return cb(err, resp, body);
  });
};

externalRequest.get = function (opts, cb) {
  opts.method = 'get';
  return externalRequest(opts, cb);
};

externalRequest.post = function (opts, cb) {
  opts.method = 'post';
  return externalRequest(opts, cb);
};

externalRequest.put = function (opts, cb) {
  opts.method = 'put';
  return externalRequest(opts, cb);
};

externalRequest.del = function (opts, cb) {
  opts.method = 'delete';
  return externalRequest(opts, cb);
};

externalRequest.logger = logger;

module.exports = externalRequest;
