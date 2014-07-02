var Hapi = require('hapi'),
    log = require('bole')('registry-star'),
    uuid = require('node-uuid');


module.exports = function (request, reply) {
  var star = request.server.methods.star,
      unstar = request.server.methods.unstar,
      addMetric = request.server.methods.addMetric;

  var opts = {
    user: request.auth.credentials,
    hiring: request.server.methods.getRandomWhosHiring()
  };

  if (request.method === 'get') {
    return reply.redirect('browse/userstar/' + opts.user.name);
  }

  if (typeof opts.user === 'undefined') {
    return reply('user isn\'t logged in').code(403);
  }

  var username = opts.user.name,
      body = JSON.parse(request.payload),
      pkg = body.name,
      starIt = !body.isStarred,
      timer = {};

  if (starIt) {
    timer.start = Date.now();
    star(pkg, username, function (err, data) {
      timer.end = Date.now();
      addMetric({
        name: 'latency',
        value: timer.end - timer.start,
        type: 'couchdb',
        star: pkg
      });

      if (err) {
        var errId = uuid.v1();
        log.error(errId + ' ' + Hapi.error.internal(username + 'was unable to star ' + pkg), err);
        return reply('not ok - ' + errId).code(500);
      }

      addMetric({ name: 'star', package: pkg });
      return reply(username + ' starred ' + pkg).code(200);
    });
  } else {
    timer.start = Date.now();
    unstar(pkg, username, function (err, data) {
      timer.end = Date.now();
      addMetric({
        name: 'latency',
        value: timer.end - timer.start,
        type: 'couchdb',
        unstar: pkg
      });

      if (err) {
        var errId = uuid.v1();
        log.error(errId + ' ' + Hapi.error.internal(username + 'was unable to unstar ' + pkg), err);
        return reply('not ok - ' + errId).code(500);
      }

      addMetric({ name: 'unstar', package: pkg });
      return reply(username + ' unstarred ' + pkg).code(200);
    });
  }
}