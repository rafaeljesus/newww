// this is where we can test general template stuff (for now)

var Lab = require('lab'),
    describe = Lab.experiment,
    before = Lab.before,
    it = Lab.test,
    expect = Lab.expect;

var Hapi = require('hapi'),
    company = require('../facets/company'),
    bonbon = require('../adapters/bonbon'),
    config = require('../config'),
    MetricsClient = require('../adapters/metrics');

var os = require('os');

var server, source;

var serverOptions = {
  views: {
    engines: {hbs: require('handlebars')},
    partialsPath: './hbs-partials',
    helpersPath: './hbs-helpers'
  }
};

var opts = {
  url: '/about'
};

before(function (done) {
  var metrics = new MetricsClient(config.metrics);

  server = Hapi.createServer(serverOptions);
  server.methods = require('./fixtures/mock-server-methods')(server);

  server.ext('onPreResponse', function (request, next) {
    source = request.response.source;
    next();
  });

  server.pack.register([
    { plugin: company, options: config.company },
    { plugin: require('crumb'), options: { cookieOptions: {isSecure: true} } },
    {
      plugin: bonbon,
      options: {
        canonicalHost: config.canonicalHost,
        stamp: config.stamp
      }
    }
  ], done);
});

describe('our expected layout elements', function () {
  it('should have a stamp', function (done) {
    server.inject(opts, function (response) {
      expect(source.context.stamp).to.exist;
      expect(source.context.stamp).to.include('pid');
      expect(source.context.stamp).to.include(os.hostname());
      expect(response.payload).to.include(config.stamp);
      done();
    });
  });

  it('should have the canonical url in the header', function (done) {
    server.inject(opts, function (response) {
      expect(source.context.canonicalHref).to.exist;
      expect(source.context.canonicalHref).to.include('/about');
      expect(response.payload).to.include(config.canonicalHref);
      done();
    });
  });
});