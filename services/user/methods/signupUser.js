var Hapi = require('hapi'),
    anonCouch = require('../../../adapters/couchDB').anonCouch,
    metrics = require('../../../adapters/metrics')();

module.exports = function signupUser (acct, next) {
  var timer = { start: Date.now() };
  anonCouch.signup(acct, function (er, cr, data) {
    timer.end = Date.now();
    metrics.addCouchLatencyMetric(timer, 'signupUser');

    if (er || cr && cr.statusCode >= 400 || data && data.error) {
        var error = "Failed creating account.  CouchDB said: "
                  + ((er && er.message) || (data && data.error))

      return next(Hapi.error.forbidden(error));
    }

    return next(null, data);
  });
}
