var Hapi = require('hapi'),
    log = require('bole')('user-login'),
    uuid = require('node-uuid'),
    murmurhash = require('murmurhash'),
    metrics = require('../../../adapters/metrics')();

module.exports = {
  set: function set (request) {
    return function (user, next) {
      var sid = murmurhash.v3(user.name, 55).toString(16),
          timer = { start: Date.now() };

      user.sid = sid;

      request.server.app.cache.set(sid, user, 0, function (err) {
        if (err) {
          var errId = uuid.v1();
          log.error(errId + ' ' + Hapi.error.internal('there was an error setting the cache'));

          metrics.addMetric({name: 'setSessionError'});
          return next(Hapi.error.internal(errId));
        }

        timer.end = Date.now();
        metrics.addMetric({
          name: 'latency',
          value: timer.end - timer.start,
          type: 'redis',
          action: 'setSession'
        });

        request.auth.session.set({sid: sid});
        return next(null);
      });
    }
  },

  del: function del (request) {
    return function (user, next) {
      var sid = murmurhash.v3(user.name, 55).toString(16),
          timer = { start: Date.now() };

      user.sid = sid;

      request.server.methods.user.logoutUser(user.token, function () {

        request.server.app.cache.drop(sid, function (err) {
          if (err) {
            var errId = uuid.v1();
            log.error(errId + ' ' + Hapi.error.internal('there was an error clearing the cache'));
            metrics.addMetric({name: 'delSessionError'});
            return next(Hapi.error.internal(errId));
          }

          timer.end = Date.now();
          metrics.addMetric({
            name: 'latency',
            value: timer.end - timer.start,
            type: 'redis',
            action: 'delSession'
          });

          request.auth.session.clear();
          return next(null);
        });
      });
    }
  }
}
