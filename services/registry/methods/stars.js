var Hapi = require('hapi'),
    adminCouch = require('../../../adapters/couchDB').adminCouch,
    validatePackageName = require("validate-npm-package-name"),
    log = require('bole')('registry-stars'),
    metrics = require('../../../adapters/metrics')();

var timer = {};

module.exports = {
  star: function star (package, username, next) {
    timer.start = Date.now();

    if (!validatePackageName(package).valid) {
      return next(Hapi.error.badRequest("Invalid package name"));
    }

    adminCouch.put('/registry/_design/app/_update/star/' + package, username, function (er, cr, data) {
      timer.end = Date.now();
      metrics.metric({
  name: 'latency',
  value: timer.end - timer.start,
  type: 'couch',
  action: 'star'
});

      if (er || cr && cr.statusCode !== 201 || !data || data.error) {
        return next(Hapi.error.internal(er || data.error));
      }

      log.info(package + ' starred by ' + username);
      return next(null, data);
    });
  },

  unstar: function unstar (package, username, next) {
    timer.start = Date.now();

    if (!validatePackageName(package).valid) {
      return next(Hapi.error.badRequest("Invalid package name"));
    }

    adminCouch.put('/registry/_design/app/_update/unstar/' + package, username, function (er, cr, data) {
      timer.end = Date.now();
      metrics.metric({
  name: 'latency',
  value: timer.end - timer.start,
  type: 'couch',
  action: 'unstar'
});

      if (er || cr && cr.statusCode !== 201 || !data || data.error) {
        return next(Hapi.error.internal(er || data.error));
      }

      log.info(package + ' unstarred by ' + username);
      return next(null, data);
    });
  }

}
