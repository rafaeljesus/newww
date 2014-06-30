var Hapi = require('hapi'),
    company = require('../../');

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

  server.pack.register(company, done);

  return server;
}
