var Boom = require('boom'),
    metrics = require('../../../adapters/metrics')(),
    redisSessions = require('../../../adapters/redis-sessions');

module.exports = {
  set: function set (request) {
    return function (user, next) {
      var timer = { start: Date.now() };

      var data = {
        name: user.name,
        sid: redisSessions.generateRandomUserHash(user.name)
      };

      request.server.app.cache.set(data.sid, data, 0, function (err) {
        if (err) {
          request.logger.error(Boom.internal('there was an error setting the cache'));

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
    };
  },

  del: function del (request) {
    return function (user, next) {
      var start = Date.now();

      if (!user.sid) {
        request.auth.session.clear();
        return next(null);
      }

      request.server.app.cache.drop(user.sid, function (err) {
        if (err) {
          request.logger.error(Boom.internal('there was an error clearing the cache'));
          request.logger.error(err);
          metrics.metric({name: 'delSessionError'});
        }

        metrics.metric({
          name: 'latency',
          value: Date.now() - start,
          type: 'redis',
          action: 'delSession'
        });

        request.auth.session.clear();

        return next(null);
      });
    };
  }
};
