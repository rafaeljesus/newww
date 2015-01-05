var Hapi = require('hapi'),
    request = require('request'),
    log = require('bole')('downloads');

module.exports = function getDownloads (url) {
  return function (period, detail, package, callback) {

    var opts = {
      url:     url + detail + '/' + period + '/' + (package || ''),
      json:    true,
      timeout: 2000,
    };

    request.get(opts, function (err, resp, body) {

      if (err) {
        log.warn(err);
        log.warn(err.code + ' error downloading from ' + opts.url);
        return callback(err);
      }

      if (!body) {
        log.warn('we got no body back from ' + opts.url);
        return callback(null, 0);
      }

      callback(null, body.downloads || 0);
    });
  };
}
