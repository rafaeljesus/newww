var Hapi = require('hapi'),
    company = require('../../'),
    config = require('../../../../config').company,
    metricsConfig = require('../../../../config').metrics,
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

  server.pack.register([
    { plugin: company, options: config },
    { plugin: require('crumb'), options: { isSecure: true } }
  ], done);

  return server;
}
