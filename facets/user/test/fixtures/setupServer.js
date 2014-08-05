var Hapi = require('hapi'),
    config = require('../../../../config').user,
    metricsConfig = require('../../../../config').metrics,
    user = require('../../'),
    MetricsClient = require('../../../../adapters/metrics');

var serverOptions = {
  views: {
    engines: {hbs: require('handlebars')},
    partialsPath: '../../hbs-partials',
    helpersPath: '../../hbs-helpers'
  }
};

module.exports = function (done) {
  process.env.NODE_ENV = 'dev';

  var metrics = new MetricsClient(metricsConfig);

  var server = Hapi.createServer(serverOptions);
  server.methods = require('./mock-server-methods')(server);

  server.pack.register(require('hapi-auth-cookie'), function (err) {
    if (err) throw err;

    server.app.cache = server.cache('sessions', {
      expiresIn: 30
    });

    server.auth.strategy('session', 'cookie', 'try', {
      password: '12345'
    });

    server.pack.register([
      { plugin: user, options: config },
      { plugin: require('crumb'), options: { isSecure: true } }
    ], function (err) {

      // manually start the cache
      server.app.cache._cache.connection.start(done);
    });
  });

  return server;
}
