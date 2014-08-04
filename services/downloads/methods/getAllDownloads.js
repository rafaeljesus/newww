var Hapi = require('hapi'),
    log = require('bole')('downloads'),
    uuid = require('node-uuid'),
    getDownloads = require('./getDownloads'),
    metrics = require('../../../adapters/metrics')(),
    timer = {};

module.exports = function getAllDownloads (url) {
  return function (package, next) {
    timer.start = Date.now();
    if (typeof package === 'function') {
      next = package;
      package = null;
    }

    var n = 3,
        dls = {};

    getDownloads(url)('last-day', 'point', package, cb('day'));
    getDownloads(url)('last-week', 'point', package, cb('week'));
    getDownloads(url)('last-month', 'point', package, cb('month'));

    function cb (which) {
      return function (err, data) {
        if (err) {
          log.warn(uuid.v1() + ' ' + Hapi.error.internal('download error for ' + which), err);
        }

        dls[which] = data || 0;

        if (--n === 0) {
          timer.end = Date.now();
          metrics.addMetric({
            name: 'latency',
            value: timer.end - timer.start,
            type: 'downloads',
            action: 'all downloads' + (package ? ' for ' + package : '')
          });

          next(null, dls);
        }

      }
    }
  }
}
