var murmurhash = require('murmurhash');

module.exports = function login (request, reply) {
  var loginUser = request.server.methods.loginUser,
      setSession = request.server.methods.setSession(request);

  if (request.auth.isAuthenticated) {
    return reply().redirect('/');
  }

  var opts = {};

  if (request.method === 'post') {

    if (!request.payload.name || !request.payload.password) {
      opts.message = 'Missing username or password';
    } else {
      loginUser(request.payload, function (er, user) {

        if (er || !user) {
          opts.message = 'Invalid username or password';

          return reply.view('login', opts);
        }

        setSession(user, function (err) {
          if (err) {
            return reply.view('error', err);
          }

          if (user && user.mustChangePass) {
            return reply.redirect('/password');
          }

          return reply.redirect('/');
        });
      });
    }
  }

  if (request.method === 'get' || opts.message) {
    // console.log(opts.message)
    return reply.view('login', opts)
  }
}