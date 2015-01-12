var Boom = require('boom'),
    Hapi = require('hapi'),
    log = require('bole')('user-login'),
    metrics = require('../../../adapters/metrics')(),
    redisSessions = require('../../../adapters/redis-sessions');


module.exports = {
  set: function set (request) {
    return function (user, next) {
      var timer = { start: Date.now() };

      user.sid = redisSessions.generateRandomUserHash(user.name);

      request.server.app.cache.set(user.sid, user, 0, function (err) {
        if (err) {
          log.error(Boom.internal('there was an error setting the cache'));

          metrics.metric({name: 'setSessionError'});
          return next(err);
        }

        timer.end = Date.now();
        metrics.metric({
          name: 'latency',
          value: timer.end - timer.start,
          type: 'redis',
          action: 'setSession'
        });

        request.auth.session.set({user: user.name, sid: user.sid});
        return next(null);
      });
    }
  },

  del: function del (request) {
    return function (user, next) {
      var timer = { start: Date.now() };

      request.server.methods.user.logoutUser(user.token, function () {

        request.server.app.cache.drop(user.sid, function (err) {
          if (err) {
            log.error(Boom.internal('there was an error clearing the cache'));
            metrics.metric({name: 'delSessionError'});
            return next(err);
          }

          timer.end = Date.now();
          metrics.metric({
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
