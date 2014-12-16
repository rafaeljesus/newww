var Hapi = require('hapi'),
    util = require('util');

module.exports = function (request, reply) {
  var getPackage = request.server.methods.registry.getPackage,
      star = request.server.methods.registry.star,
      unstar = request.server.methods.registry.unstar,
      showError = request.server.methods.errors.showError(request, reply);

  var opts = {
    user: request.auth.credentials,
    namespace: 'registry-star',
    isXhr: true
  };

  if (request.method === 'get') {
    return reply.redirect('browse/userstar/' + opts.user.name);
  }

  if (!opts.user) {
    return showError(null, 403, 'user isn\'t logged in', opts);
  }

  var username = opts.user.name,
      body = request.payload,
      pkg = body.name,
      starIt = !!body.isStarred.match(/true/i)

  if (starIt) {
    star(pkg, username, function (err, data) {

      if (err) {
        return showError([err, util.format("%s was unable to star %s", username, pkg)], 500, 'not ok', opts);
      }

      getPackage.cache.drop(pkg, function (er, resp) {
        if (er) {
          return showError([er, util.format("unable to drop cache for %s", pkg)], 500, 'not ok', opts);
        }

        request.timing.page = 'star';
        request.metrics.metric({ name: 'star', package: pkg });
        return reply(username + ' starred ' + pkg).code(200);
      });
    });

  } else {

    unstar(pkg, username, function (err, data) {
      if (err) {
        return showError([err, util.format("%s was unable to unstar %s", username, pkg)], 500, 'not ok', opts);
      }

      getPackage.cache.drop(pkg, function (er, resp) {
        if (er) {
          return showError([er, util.format("unable to drop cache for %s", pkg)], 500, 'not ok', opts);
        }

        request.timing.page = 'unstar';
        request.metrics.metric({ name: 'unstar', package: pkg });

        return reply(username + ' unstarred ' + pkg).code(200);
      });
    });
  }
}
