var Lab = require('lab')
  , describe = Lab.experiment
  , before = Lab.before
  , it = Lab.test
  , expect = Lab.expect;

var Hapi = require('hapi'),
    company = require('../facets/company'),
    config = require('../config').company,
    metricsConfig = require('../config').metrics,
    MetricsClient = require('../adapters/metrics');

var server;

before(function (done) {
  var metrics = new MetricsClient(metricsConfig);

  server = Hapi.createServer();
  server.pack.register({ plugin: company, options: config }, done);
});

describe('company is routing properly', function () {
  it('calls all the right routes', function (done) {
    var table = server.table();

    expect(table).to.have.length(7);

    var paths = table.map(function (route) {
      var obj = {
        path: route.path,
        method: route.method
      }
      return obj;
    });

    expect(paths).to.include({ path: '/', method: 'get' });
    expect(paths).to.include({ path: '/about', method: 'get' });
    expect(paths).to.include({ path: '/whoshiring', method: 'get' });
    expect(paths).to.include({ path: '/joinwhoshiring', method: 'get' });
    expect(paths).to.include({ path: '/joinwhoshiring', method: 'post' });
    expect(paths).to.include({ path: '/npme-beta', method: 'get' });
    expect(paths).to.include({ path: '/npme-beta-thanks', method: 'get' });

    done();
  })
})