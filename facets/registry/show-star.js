
module.exports = function (request, reply) {
  var getPackage = request.server.methods.registry.getPackage,
      star = request.server.methods.registry.star,
      unstar = request.server.methods.registry.unstar;

  var opts = {
    user: request.auth.credentials
  };

  if (request.method === 'get') {
    return reply.redirect('browse/userstar/' + opts.user.name);
  }

  if (!opts.user) {
    request.logger.error('user is not logged in');
    reply('user is not logged in').code(403);
    return;
  }

  var username = opts.user.name,
      body = request.payload,
      pkg = body.name,
      starIt = !!body.isStarred.match(/true/i);

  if (starIt) {
    star(pkg, username, function (err) {

      if (err) {
        request.logger.error(username + ' was unable to star ' + pkg);
        request.logger.error(err);
        reply('not ok').code(500);
        return;
      }

      getPackage.cache.drop(pkg, function (er) {

        if (er) {
          request.logger.error('unable to drop cache for ' + pkg);
          request.logger.error(er);
          reply('not ok').code(500);
          return;
        }

        request.timing.page = 'star';
        request.metrics.metric({ name: 'star', package: pkg });
        return reply(username + ' starred ' + pkg).code(200);
      });
    });

  } else {

    unstar(pkg, username, function (err) {

      if (err) {
        request.logger.error(username + ' was unable to unstar ' + pkg);
        request.logger.error(err);
        reply('not ok').code(500);
        return;
      }

      getPackage.cache.drop(pkg, function (er) {
        if (er) {
          request.logger.error('unable to drop cache for ' + pkg);
          request.logger.error(er);
          reply('not ok').code(500);
          return;
        }

        request.timing.page = 'unstar';
        request.metrics.metric({ name: 'unstar', package: pkg });

        return reply(username + ' unstarred ' + pkg).code(200);
      });
    });
  }
};
