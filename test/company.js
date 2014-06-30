var Lab = require('lab')
  , describe = Lab.experiment
  , before = Lab.before
  , it = Lab.test
  , expect = Lab.expect;

var Hapi = require('hapi'),
    company = require('../facets/company');

var server;

before(function (done) {
  server = Hapi.createServer();
  server.pack.register(company, done);
});

describe('company is routing properly', function () {
  it('calls all the right routes', function (done) {
    var table = server.table();

    expect(table).to.have.length(2);

    var paths = table.map(function (route) {
      var obj = {
        path: route.path,
        method: route.method
      }
      return obj;
    });

    expect(paths).to.include({ path: '/', method: 'get' });
    expect(paths).to.include({ path: '/whoshiring', method: 'get' });

    done();
  })
})