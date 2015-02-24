var Boom = require('boom'),
    CouchLogin = require('couch-login'),
    Hapi = require('hapi'),
    log = require('bole')('user-login'),
    uuid = require('node-uuid'),
    metrics = require('../../../adapters/metrics')();

module.exports = function (options, service) {

  return {
    login: function (loginDetails, next) {
      var timer = { start: Date.now() };
      var loginCouch = new CouchLogin(options.registryCouch, NaN);
      loginCouch.login(loginDetails, function (er, cr, couchSession) {
        if (er) {
          log.error(uuid.v1() + ' ' + Boom.internal('Unable to log in user ' + loginDetails.name), er);

          return next(Boom.internal('Unable to log in user ' + loginDetails.name));
        }

        if (cr.statusCode !== 200) {
          log.error(uuid.v1() + ' ' + Boom.forbidden('Invalid login credentials for ' + loginDetails.name), er);

          return next(Boom.forbidden('Username and/or Password is wrong'));
        }

        // get the official details from loginCouch, not anonCouch
        loginCouch.get('/_users/org.couchdb.user:' + loginDetails.name, function (err, cr, data) {
          if (err) {
            log.error(uuid.v1() + ' ' + Boom.internal('Unable to get user ' + loginDetails.name + ' from couch'), err);
          }

          timer.end = Date.now();
          metrics.metric({
  name: 'latency',
  value: timer.end - timer.start,
  type: 'couch',
  action: 'login'
});

          // attach the token to the user data so we can save it in the session
          data.token = loginCouch.token

          return next(err, data);
        });
      });
    },

    logout: function (token, next) {
      var logoutCouch = new CouchLogin(options.registryCouch, token);
      logoutCouch.logout(next)
    }
  };
};
