var Hapi = require('hapi'),
    log = require('bole')('registry-star'),
    uuid = require('node-uuid'),
    util = require('util'),
    metrics = require('../../adapters/metrics')();

module.exports = function (request, reply) {
  var getPackage = request.server.methods.registry.getPackage,
      star = request.server.methods.registry.star,
      unstar = request.server.methods.registry.unstar,
      addMetric = metrics.addMetric,
      addLatencyMetric = metrics.addPageLatencyMetric,
      timer = { start: Date.now() };

  var opts = {
    user: request.auth.credentials,
    hiring: request.server.methods.hiring.getRandomWhosHiring()
  };

  if (request.method === 'get') {
    return reply.redirect('browse/userstar/' + opts.user.name);
  }

  if (typeof opts.user === 'undefined') {
    log.error(uuid.v1() + 'user isn\'t logged in');
    return reply('user isn\'t logged in').code(403);
  }

  var username = opts.user.name,
      body = request.payload,
      pkg = body.name,
      starIt = !!body.isStarred.match(/true/i)

  if (starIt) {

    star(pkg, username, function (err, data) {

      if (err) {
        var errId = uuid.v1();
        log.error(errId + ' ' + Hapi.error.internal(util.format("%s was unable to star %s", username, pkg)), err);
        return reply('not ok - ' + errId).code(500);
      }

      getPackage.cache.drop(pkg, function (er, resp) {
        if (er) {
          var errId = uuid.v1();
          log.error(errId + ' ' + Hapi.error.internal(util.format("unable to drop cache for %s", pkg)), err);
          return reply('not ok - ' + errId).code(500);
        }

        timer.end = Date.now();
        addLatencyMetric(timer, 'star');

        addMetric({ name: 'star', package: pkg });
        return reply(username + ' starred ' + pkg).code(200);
      });
    });
  } else {

    unstar(pkg, username, function (err, data) {

      if (err) {
        var errId = uuid.v1();
        log.error(errId + ' ' + Hapi.error.internal(util.format("%s was unable to unstar %s", username, pkg)), err);
        return reply('not ok - ' + errId).code(500);
      }

      getPackage.cache.drop(pkg, function (er, resp) {
        if (er) {
          var errId = uuid.v1();
          log.error(errId + ' ' + Hapi.error.internal(util.format("unable to drop cache for %s", pkg)), err);
          return reply('not ok - ' + errId).code(500);
        }

        timer.end = Date.now();
        addLatencyMetric(timer, 'unstar');

        addMetric({ name: 'unstar', package: pkg });
        return reply(username + ' unstarred ' + pkg).code(200);
      });
    });
  }
}
