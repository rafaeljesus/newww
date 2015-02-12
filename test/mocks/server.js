var Hapi = require('hapi'),
    config = require('../../config');

module.exports = function (done) {
  process.env.NODE_ENV = 'dev';

  var metrics = require('../../adapters/metrics')(config.metrics);

  var server = new Hapi.Server();
  server.connection();
  server.views(config.views);
  server.methods = require('./server-methods')(server);

  server.register(require('hapi-auth-cookie'), function (err) {
    if (err) { throw err; }

    server.app.cache = server.cache({
      expiresIn: 30,
      segment: '|sessions'                  // Adding a '|' prefix to keep the cache keys same as in hapi 7.x and older
    });

    server.auth.strategy('session', 'cookie', 'required', {
      password: '12345',
      redirectTo: '/login'
    });

    server.models = {
      Collaborator: require('../mocks/models/collaborator'),
      Customer: require('../mocks/models/customer'),
      User: require('../mocks/models/user'),
      Package: require('../mocks/models/package')
    };

    server.register([{
        register: require('crumb'),
        options: { cookieOptions: { isSecure: true } }
      },
      require('../../adapters/bonbon')
    ], function (err) {
      server.route(require('../../routes'));

      server.start(function () {
        return done(server);
      });
    });
  });
};
