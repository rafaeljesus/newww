var Lab = require('lab')
  , describe = Lab.experiment
  , before = Lab.before
  , it = Lab.test
  , expect = Lab.expect;

var Hapi = require('hapi'),
    user = require('../facets/user');

user.name = 'user';
user.version = '0.0.1';

var server;

before(function (done) {
  server = Hapi.createServer();
  server.pack.register(user, done);
});

describe('user is routing properly', function () {
  it('calls all the right routes', function (done) {
    var table = server.table();

    expect(table).to.have.length(5);

    var paths = table.map(function (route) {
      var obj = {
        path: route.path,
        method: route.method
      }
      return obj;
    });

    expect(paths).to.include({ path: '/~', method: 'get' });
    expect(paths).to.include({ path: '/~{name}', method: 'get' });
    expect(paths).to.include({ path: '/login', method: 'get' });
    expect(paths).to.include({ path: '/login', method: 'post' });
    expect(paths).to.include({ path: '/logout', method: 'get' });

    done();
  })
})