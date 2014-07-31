var Hapi = require('hapi'),
    adminCouch = require('../couchDB').adminCouch;

module.exports = function changePass (auth, next) {
  var timer = { start: Date.now() };
  adminCouch.changePass(auth, function (er, cr, data) {
    timer.end = Date.now();
    // addMetric(timer, 'changePass');

    if (er || cr.statusCode >= 400 || data && data.message) {
      var error = er && er.message || data && data.message;
      return next(Hapi.error.forbidden(error));
    }

    return next(null, data);
  });
}
