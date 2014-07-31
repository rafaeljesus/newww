var Hapi = require('hapi'),
    anonCouch = require('../../../couchDB').anonCouch;

module.exports = function packagesCreated (next) {
  var timer = { start: Date.now() };

  anonCouch.get('/registry/_design/app/_view/fieldsInUse?group_level=1&startkey="name"&endkey="name"&stale=update_after', function (er, cr, data) {

    timer.end = Date.now();
    // addMetric(timer, 'packagesCreated');

    if (er || data.error) {
      return next(Hapi.error.internal(er || data.error));
    }

    if (data.rows && data.rows.length > 0 && data.rows[0].value) {
      return next(null, data.rows[0].value);
    }

    return next(null, 0); // worst case scenario
  });
}