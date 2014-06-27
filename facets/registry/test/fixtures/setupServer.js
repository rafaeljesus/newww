var Hapi = require('hapi'),
    registry = require('../../');

var serverOptions = {
  views: {
    engines: {hbs: require('handlebars')},
    partialsPath: '../../hbs-partials',
    helpersPath: '../../hbs-helpers'
  }
};

module.exports = function (done) {
  process.env.NODE_ENV = 'dev';

  var server = Hapi.createServer(serverOptions);
  server.methods = require('./mock-couch-methods')(server);

  server.pack.register(require('hapi-auth-cookie'), function (err) {
    if (err) throw err;

    server.auth.strategy('session', 'cookie', 'try', {
      password: '12345'
    });

    server.pack.register(registry, done);
  });

  return server;
}
