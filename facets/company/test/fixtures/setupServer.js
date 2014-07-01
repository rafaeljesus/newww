var Hapi = require('hapi'),
    company = require('../../'),
    config = require('../../../../config').payments;

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

  server.pack.register({ plugin: company, options: config }, done);

  return server;
}
