var Hapi = require('hapi'),
    config = require('../../config'),
    metricsConfig = config.metrics,
    MetricsClient = require('../../adapters/metrics');

var serverOptions = {
  views: config.server.views
};

module.exports = function (done) {
  process.env.NODE_ENV = 'dev';

  var metrics = new MetricsClient(metricsConfig);

  var server = Hapi.createServer(serverOptions);
  server.methods = require('./mock-server-methods')(server);

  server.pack.register(require('hapi-auth-cookie'), function (err) {
    if (err) throw err;

    server.auth.strategy('session', 'cookie', 'try', {
      password: '12345'
    });

    server.pack.register({
      plugin: require('crumb'),
      options: { cookieOptions: { isSecure: true } }
    }, function (err) {
      server.route(require('../../routes'));

      return done();
    });

  });

  return server;
}