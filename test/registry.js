var Lab = require('lab')
  , describe = Lab.experiment
  , before = Lab.before
  , it = Lab.test
  , expect = Lab.expect;

var Hapi = require('hapi'),
    registry = require('../facets/registry');

var server;

before(function (done) {
  server = Hapi.createServer();
  server.pack.register(require('hapi-auth-cookie'), function (err) {
    if (err) throw err;

    server.auth.strategy('session', 'cookie', 'try', {
      password: '12345'
    });

    server.pack.register(registry, done);
  });
});

describe('Registry is routing properly', function () {
  it('calls all the right routes', function (done) {
    var table = server.table();
    expect(table).to.have.length(6);

    var paths = table.map(function (route) {
      var obj = {
        path: route.path,
        method: route.method
      }
      return obj;
    });

    expect(paths).to.include({ path: '/search', method: 'get' });
    expect(paths).to.include({ path: '/keyword/{kw}', method: 'get' });
    expect(paths).to.include({ path: '/package/{package}/{version?}', method: 'get' });
    expect(paths).to.include({ path: '/browse/{p*}', method: 'get' });
    expect(paths).to.include({ path: '/star', method: 'get' });
    expect(paths).to.include({ path: '/star', method: 'post' });


    done();
  })
})