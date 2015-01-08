var Lab = require('lab'),
    lab = exports.lab = Lab.script(),
    describe = lab.experiment,
    before = lab.before,
    after = lab.after,
    it = lab.test,
    expect = Lab.expect;

var server, cookieCrumb,
    pkg = 'fake',
    user = { name: 'fakeuser' };

before(function (done) {
  server = require('../fixtures/setupServer')(done);
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
  before(function (done) {
    server.inject({url: '/package/' + pkg}, function (resp) {
      var header = resp.headers['set-cookie'];
      expect(header.length).to.equal(1);

      cookieCrumb = header[0].match(/crumb=([^\x00-\x20\"\,\;\\\x7F]*)/)[1];
      done();
    });
  })

  it('should reject stars when CSRF data is missing', function (done) {
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
      expect(resp.statusCode).to.equal(403);
      done();
    });
  });

  it('should send a 403 if the user is not logged in', function (done) {
    var opts = {
      url: '/star',
      method: 'POST',
      payload: {
        name: pkg,
        isStarred: 'true',
        crumb: cookieCrumb
      },
      headers: { cookie: 'crumb=' + cookieCrumb }
    };

    server.inject(opts, function (resp) {
      expect(resp.statusCode).to.equal(403);
      expect(resp.result).to.equal('user is not logged in');
      done();
    });
  });

  it('should star an unstarred package', function (done) {
    var opts = {
      url: '/star',
      method: 'POST',
      payload: {
        name: pkg,
        isStarred: 'true',
        crumb: cookieCrumb
      },
      credentials: user,
      headers: { cookie: 'crumb=' + cookieCrumb }
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
        isStarred: 'false',
        crumb: cookieCrumb
      },
      credentials: user,
      headers: { cookie: 'crumb=' + cookieCrumb }
    };

    server.inject(opts, function (resp) {
      expect(resp.statusCode).to.equal(200);
      expect(resp.result).to.equal(user.name + ' unstarred ' + pkg);
      done();
    });
  });
});