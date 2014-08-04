var Hapi = require('hapi'),
    adminCouch = require('../../../adapters/couchDB').adminCouch,
    metrics = require('../../../adapters/metrics')();

var timer = {};

module.exports = {
  star: function star (package, username, next) {
    timer.start = Date.now();
    adminCouch.put('/registry/_design/app/_update/star/' + package, username, function (er, cr, data) {
      timer.end = Date.now();
      metrics.addCouchLatencyMetric(timer, 'star');

      if (er || cr && cr.statusCode !== 201 || !data || data.error) {
        return next(Hapi.error.internal(er || data.error));
      }

      return next(null, data);
    });
  },

  unstar: function unstar (package, username, next) {
    timer.start = Date.now();
    adminCouch.put('/registry/_design/app/_update/unstar/' + package, username, function (er, cr, data) {
      timer.end = Date.now();
      metrics.addCouchLatencyMetric(timer, 'unstar');

      if (er || cr && cr.statusCode !== 201 || !data || data.error) {
        return next(Hapi.error.internal(er || data.error));
      }

      return next(null, data);
    });
  }

}