var murmurhash = require('murmurhash'),
    Hapi = require('hapi'),
    uuid = require('node-uuid'),
    log = require('bole')('user-login'),
    url = require('url');

module.exports = function login (request, reply) {
  var loginUser = request.server.methods.loginUser,
      setSession = request.server.methods.setSession(request);

  if (request.auth.isAuthenticated) {
    return reply().redirect('/');
  }

  var opts = {
    hiring: request.server.methods.getRandomWhosHiring()
  };

  if (request.method === 'post') {

    if (!request.payload.name || !request.payload.password) {
      opts.error = {
        type: 'missing'
      };
    } else {
      loginUser(request.payload, function (er, user) {

        if (er || !user) {
          var errId = uuid.v1();
          log.error(errId + ' ' + Hapi.error.badRequest('Invalid username or password'), request.payload.name);
          opts.error = {
            type: 'invalid',
            errId: errId
          };
          return reply.view('login', opts).code(400);
        }

        setSession(user, function (err) {
          if (err) {
            var errId = uuid.v1();
            log.error(errId + ' ' + err)
            return reply.view('error', {errId: errId}).code(500);
          }

          if (user && user.mustChangePass) {
            return reply.redirect('/password');
          }

          var donePath = '/';
          if (request.query.done) {
            // Make sure that we don't ever leave this domain after login
            // resolve against a fqdn, and take the resulting pathname
            var done = url.resolveObject('https://example.com/login', request.query.done.replace(/\\/g, '/'))
            donePath = done.pathname
          }

          return reply.redirect(donePath);
        });
      });
    }
  }

  if (request.method === 'get' || opts.error) {
    return reply.view('login', opts)
  }
}