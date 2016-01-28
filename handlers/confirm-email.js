var utils = require('../lib/utils'),
  UserAgent = require('../agents/user');

module.exports = function confirmEmail(request, reply) {
  var opts = {};
  var User = new UserAgent(request.loggedInUser);

  if (!request.params || !request.params.token) {
    request.logger.warn('no token parameter');
    return reply.view('errors/not-found', opts).code(404);
  }

  var token = request.params.token,
    hash = utils.sha(token),
    key = 'email_confirm_' + hash;

  request.redis.get(key, function(err, value) {

    if (err) {
      request.logger.error('Error getting token from redis: ', key);
      request.logger.error(err);
      reply.view('errors/internal', opts).code(500);
      return;
    }

    var cached = utils.safeJsonParse(value);

    if (!cached) {
      request.logger.error('Token not found or invalid: ', key);
      reply.view('errors/token-expired', opts).code(404);
      return;
    }

    if (cached.token !== token) {
      request.logger.error('token in cache does not match user token; cached=' + cached.token + '; token=' + token);
      reply.view('errors/internal', opts).code(500);
      return;
    }

    var name = cached.name;
    request.logger.warn('Confirming email for user ' + name);

    User.get(name, function(err, user) {

      if (err) {
        request.logger.error('Failed to get user ' + name);
        request.logger.error(err);
        return reply.view('errors/internal', opts).code(500);
      }

      User.confirmEmail(user, function(err) {
        if (err) {
          request.logger.error('Failed to confirm email for ' + name);
          request.logger.error(err);
          return reply.view('errors/internal', opts).code(500);
        }

        User.dropCache(user.name, function() {

          request.redis.del(key, function(err) {

            if (err) {
              request.logger.warn('Unable to drop confirm token ' + key);
              request.logger.warn(err);
            }

            request.timing.page = 'email-confirmed';
            return reply.view('user/email-confirmed', opts);
          });
        });
      });
    });
  });
};
