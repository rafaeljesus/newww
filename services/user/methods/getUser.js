var Hapi = require('hapi'),
    anonCouch = require('../../../couchDB').anonCouch;

module.exports = function getUser (name, next) {

  var timer = { start: Date.now() };

  anonCouch.get('/_users/org.couchdb.user:' + name, function (er, cr, data) {
    timer.end = Date.now();
    // addMetric(timer, 'user ' + name);

    if (er || cr && cr.statusCode !== 200 || !data || data.error) {
      return next(Hapi.error.notFound('Username not found: ' + name));
    }

    return next(null, data);
  })
}
