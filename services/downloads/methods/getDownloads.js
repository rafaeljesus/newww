var Hapi = require('hapi'),
    request = require('request'),
    log = require('bole')('downloads'),
    uuid = require('node-uuid'),
    timer = {};

module.exports = function getDownloads (url) {
  return function (period, detail, package, next) {
    timer.start = Date.now();
    var endpoint = url + detail + '/' + period + '/' + (package || '');

    request.get({
      url: endpoint,
      json: true
    }, function (err, resp, body) {
      body = body || {error: 'empty body'};

      if (body.error) {
        log.warn(uuid.v1() + ' ' + Hapi.error.internal('error downloading from ' + endpoint), err);
        err = new Error(body);
      }

      return next(err, body.downloads || 0);
    });
  };
}
