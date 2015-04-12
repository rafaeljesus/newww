var Request = require('request');
var bole = require('bole');
var clf = require('../lib/utils').toCommonLogFormat;
var logger = bole('EXTERNAL');

var externalRequest = function externalRequest (opts, cb) {

  Request(opts, function (err, resp, body) {

    logger.info(clf(resp));

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
