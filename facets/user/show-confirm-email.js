var crypto = require('crypto');

module.exports = function confirmEmail (request, reply) {
  var opts = {},
      cache = request.server.app.cache;

  var User = new request.server.models.User({logger: request.logger});

  if (!request.params || !request.params.token) {
    request.logger.warn('no token parameter');
    return reply.view('errors/not-found', opts).code(404);
  }

  var token = request.params.token,
      hash = sha(token),
      key = 'email_confirm_' + hash;

  cache.get(key, function (err, item, cached) {
    if (err) {
      request.logger.error('Error getting token from redis: ', key);
      request.logger.error(err);
      reply.view('errors/internal', opts).code(500);
      return;
    }

    if (!cached) {
      request.logger.error('Token not found or invalid: ', key);
      reply.view('errors/not-found', opts).code(404);
      return;
    }

    var name = cached.item.name;

    if (cached.item.token !== token) {
      request.logger.error('token in cache does not match user token; cached=' + cached.item.token + '; token=' + token);
      reply.view('errors/internal', opts).code(500);
      return;
    }

    request.logger.warn('Confirming email for user ' + name);

    User.confirmEmail(cached.item, function (err) {

      if (err) {
        request.logger.error('Failed to confirm email for ' + name);
        request.logger.error(err);
        return reply.view('errors/internal', opts).code(500);
      }

      cache.drop(key, function (err) {

        if (err) {
          request.logger.warn('Unable to drop key ' + key);
          request.logger.warn(err);
        }

        request.timing.page = 'email-confirmed';

        request.metrics.metric({ name: 'email-confirmed' });
        return reply.view('user/email-confirmed', opts);
      });
    });

  });
};

function sha (token) {
  return crypto.createHash('sha1').update(token).digest('hex');
}
