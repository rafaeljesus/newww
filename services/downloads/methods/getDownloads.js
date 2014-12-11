var Hapi = require('hapi'),
    request = require('request'),
    log = require('bole')('downloads'),
    uuid = require('node-uuid'),
    metrics = require('newww-metrics')(),
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

      timer.end = Date.now();
      metrics.addMetric({
        name: 'latency',
        value: timer.end - timer.start,
        type: 'downloads',
        action: endpoint
      });

      return next(err, body.downloads || 0);
    });
  };
}
