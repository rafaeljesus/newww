var Hapi = require('hapi'),
    anonCouch = require('../couchDB').anonCouch;

module.exports = function getPackage (package, next) {

  var timer = {start: Date.now()};
  anonCouch.get('/registry/' + package, function (er, cr, data) {
    timer.end = Date.now();
    // addMetric(timer, 'package ' + package);

    if (er || data.error) {
      return next(Hapi.error.notFound('Package not found: ' + package));
    }

    return next(null, data);
  });
}
