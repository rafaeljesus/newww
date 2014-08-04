var Hapi = require('hapi'),
    adminCouch = require('../../../adapters/couchDB').adminCouch,
    metrics = require('../../../adapters/metrics')();

module.exports = function saveProfile (user, next) {
  var timer = { start: Date.now() };
  adminCouch.post('/_users/_design/_auth/_update/profile/' + user._id, user, function (er, cr, data) {
    timer.end = Date.now();
    metrics.addCouchLatencyMetric(timer, 'saveProfile');

    if (er || cr && cr.statusCode !== 201 || !data || data.error) {
      return next(Hapi.error.internal(er || data.error));
    }

    return next(null, data);
  });
}
