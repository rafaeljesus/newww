var Lab = require('lab')
  , describe = Lab.experiment
  , before = Lab.before
  , it = Lab.test
  , expect = Lab.expect;

var Hapi = require('hapi'),
    user = require('../facets/user');

var server;

before(function (done) {
  server = Hapi.createServer();

  server.pack.register(require('hapi-auth-cookie'), function (err) {
    if (err) throw err;

    server.auth.strategy('session', 'cookie', 'try', {
      password: '12345'
    });

    server.pack.register(user, done);
  });
});

describe('user is routing properly', function () {
  it('calls all the right routes', function (done) {
    var table = server.table();

    expect(table).to.have.length(27);

    var paths = table.map(function (route) {
      var obj = {
        path: route.path,
        method: route.method
      }
      return obj;
    });

    expect(paths).to.include({ path: '/~', method: 'get' });
    expect(paths).to.include({ path: '/~{name}', method: 'get' });
    expect(paths).to.include({ path: '/~/{name}', method: 'get' });
    expect(paths).to.include({ path: '/profile/{name}', method: 'get' });
    expect(paths).to.include({ path: '/login', method: 'get' });
    expect(paths).to.include({ path: '/login', method: 'post' });
    expect(paths).to.include({ path: '/logout', method: 'get' });
    expect(paths).to.include({ path: '/signup', method: 'get' });
    expect(paths).to.include({ path: '/signup', method: 'head' });
    expect(paths).to.include({ path: '/profile-edit', method: 'get' });
    expect(paths).to.include({ path: '/profile-edit', method: 'head' });
    expect(paths).to.include({ path: '/profile-edit', method: 'post' });
    expect(paths).to.include({ path: '/profile-edit', method: 'put' });
    expect(paths).to.include({ path: '/email-edit', method: 'get' });
    expect(paths).to.include({ path: '/email-edit', method: 'head' });
    expect(paths).to.include({ path: '/email-edit', method: 'post' });
    expect(paths).to.include({ path: '/email-edit', method: 'put' });
    expect(paths).to.include({ path: '/password', method: 'get' });
    expect(paths).to.include({ path: '/password', method: 'head' });
    expect(paths).to.include({ path: '/password', method: 'post' });
    expect(paths).to.include({ path: '/forgot/{token?}', method: 'get' });
    expect(paths).to.include({ path: '/forgot/{token?}', method: 'head' });
    expect(paths).to.include({ path: '/forgot/{token?}', method: 'post' });

    done();
  })
})