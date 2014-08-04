var Hapi = require('hapi'),
    adminCouch = require('../../../adapters/couchDB').adminCouch,
    metrics = require('../../../adapters/metrics')();

module.exports = function changePass (auth, next) {
  var timer = { start: Date.now() };
  adminCouch.changePass(auth, function (er, cr, data) {
    timer.end = Date.now();
    metrics.addCouchLatencyMetric(timer, 'changePass');

    if (er || cr.statusCode >= 400 || data && data.message) {
      var error = er && er.message || data && data.message;
      return next(Hapi.error.forbidden(error));
    }

    return next(null, data);
  });
}
