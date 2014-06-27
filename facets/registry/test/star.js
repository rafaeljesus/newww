var Lab = require('lab'),
    describe = Lab.experiment,
    before = Lab.before,
    it = Lab.test,
    expect = Lab.expect;

var server,
    pkg = 'request',
    user = { name: 'fakeuser' };

before(function (done) {
  server = require('./fixtures/setupServer')(done);
});

describe('Accessing the star page via GET', function () {
  it('redirects to login if user is unauthorized', function (done) {
    var opts = {
      url: '/star'
    };

    server.inject(opts, function (resp) {
      expect(resp.statusCode).to.equal(302);
      expect(resp.headers.location).to.include('/login');
      done();
    });
  });

  it('goes to the userstar browse page for authorized users', function (done) {
    var opts = {
      url: '/star',
      credentials: user
    };

    server.inject(opts, function (resp) {
      expect(resp.statusCode).to.equal(302);
      expect(resp.headers.location).to.include('browse/userstar/' + user.name);
      done();
    });
  });
});

describe('Accessing the star functionality via AJAX (POST)', function () {
  it('should send a 403 if the user is unauthorized', function (done) {
    var opts = {
      url: '/star',
      method: 'POST',
      payload: {
        name: pkg,
        isStarred: true
      }
    };

    server.inject(opts, function (resp) {
      expect(resp.statusCode).to.equal(403);
      expect(resp.result).to.equal('user isn\'t logged in');
      done();
    });
  });

  it('should star an unstarred package', function (done) {
    var opts = {
      url: '/star',
      method: 'POST',
      payload: {
        name: pkg,
        isStarred: false
      },
      credentials: user
    };

    server.inject(opts, function (resp) {
      expect(resp.statusCode).to.equal(200);
      expect(resp.result).to.equal(user.name + ' starred ' + pkg);
      done();
    });
  });

  it('should unstar an starred package', function (done) {
    var opts = {
      url: '/star',
      method: 'POST',
      payload: {
        name: pkg,
        isStarred: true
      },
      credentials: user
    };

    server.inject(opts, function (resp) {
      expect(resp.statusCode).to.equal(200);
      expect(resp.result).to.equal(user.name + ' unstarred ' + pkg);
      done();
    });
  });
});