var murmurhash = require('murmurhash'),
    Hapi = require('hapi'),
    uuid = require('node-uuid'),
    log = require('bole')('user-login'),
    url = require('url');

module.exports = function login (request, reply) {
  var loginUser = request.server.methods.user.loginUser,
      setSession = request.server.methods.setSession(request),
      addMetric = request.server.methods.metrics.addMetric,
      addLatencyMetric = request.server.methods.metrics.addPageLatencyMetric,
      timer = { start: Date.now() };

  if (request.auth.isAuthenticated) {
    timer.end = Date.now();
    addLatencyMetric(timer, 'login-redirect-to-home');

    return reply().redirect('/');
  }

  var opts = {
    hiring: request.server.methods.hiring.getRandomWhosHiring()
  };

  if (request.method === 'post') {

    if (!request.payload.name || !request.payload.password) {
      opts.error = {
        type: 'missing'
      };
    } else {
      // console.log("Post received, about to login")
      loginUser(request.payload, function (er, user) {
        if (er || !user) {
          var errId = uuid.v1();
          log.error(errId + ' ' + Hapi.error.badRequest('Invalid username or password'), request.payload.name);
          opts.error = {
            type: 'invalid',
            errId: errId
          };

          timer.end = Date.now();
          addLatencyMetric(timer, 'login-error');

          addMetric({name: 'login-error'})
          return reply.view('login', opts).code(400);
        }
        // console.log("Login received, user available, setting session")
        // console.log("User is",user)

        setSession(user, function (err) {
          // console.log("session set, next...")
          if (err) {
            var errId = uuid.v1();
            log.error(errId + ' ' + err)

            timer.end = Date.now();
            addLatencyMetric(timer, 'login-error');

            addMetric({name: 'login-error'})
            return reply.view('error', {errId: errId}).code(500);
          }

          if (user && user.mustChangePass) {
            timer.end = Date.now();
            addLatencyMetric(timer, 'login-must-change-pass');

            addMetric({name: 'login-must-change-pass'})
            return reply.redirect('/password');
          }

          var donePath = '/';
          if (request.query.done) {
            // Make sure that we don't ever leave this domain after login
            // resolve against a fqdn, and take the resulting pathname
            var done = url.resolveObject('https://example.com/login', request.query.done.replace(/\\/g, '/'))
            donePath = done.pathname
          }

          timer.end = Date.now();
          addLatencyMetric(timer, 'login-complete');

          addMetric({name: 'login-complete'})
          // console.log("Sending logged-in user to " + donePath)
          return reply.redirect(donePath);
        });
      });
    }
  }

  if (request.method === 'get' || opts.error) {
    timer.end = Date.now();
    addLatencyMetric(timer, 'login');

    addMetric({name: 'login'})
    return reply.view('login', opts).code(opts.error ? 400 : 200)
  }
}