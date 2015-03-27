var path = require('path');
var Hapi = require('hapi');

module.exports = function (done) {
  var metrics = require('../../adapters/metrics')();
  var server = new Hapi.Server();
  server.connection();

  server.views({
    engines: {hbs: require('handlebars')},
    relativeTo: path.resolve(__dirname, "..", ".."),
    path: './templates',
    helpersPath: './templates/helpers',
    layoutPath: './templates/layouts',
    partialsPath: './templates/partials',
    layout: 'default'
  });

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

    server.register([{
        register: require('crumb'),
        options: { cookieOptions: { isSecure: true } }
      },
      require('../../adapters/bonbon')
    ], function (err) {
      server.route(require('../../routes/index'));

      server.start(function () {
        return done(server);
      });
    });
  });
};
