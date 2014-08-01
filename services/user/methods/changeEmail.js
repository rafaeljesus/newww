var Hapi = require('hapi'),
    adminCouch = require('../../../adapters/couchDB').adminCouch,
    log = require('bole')('user-changeEmail'),
    uuid = require('node-uuid');

module.exports = function changeEmail (service) {
  return function (name, email, next) {
    var timer = { start: Date.now() };

    // this would be cleaned up by creating an atomic changeEmail update function
    service.methods.user.getUser(name, function (err, user) {
      if (err) {
        log.error(uuid.v1() + ' ' + Hapi.error.internal('Unable to get user ' + name + ' from couch'), err);
        return next(Hapi.error.internal(err));
      }

      if (user.email === email) {
        return next(null);
      }

      user.email = email;
      adminCouch.put('/_users/org.couchdb.user:' + name, user, function (er, cr, data) {
        if (er || data.error || cr.statusCode >= 400) {
          er = er || new Error(data.error);

          log.error(uuid.v1() + ' ' + Hapi.error.internal('Unable to put user ' + name + ' data into couch'), er);
          return next(Hapi.error.internal(er));
        }

        timer.end = Date.now();
        // service.methods.metrics.addCouchLatencyMetric(timer, 'changeEmail');

        return next(null);
      });
    });
  };
};