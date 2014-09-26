var Lab = require('lab'),
    lab = exports.lab = Lab.script(),
    describe = lab.experiment,
    before = lab.before,
    after = lab.after,
    it = lab.test,
    expect = Lab.expect;

var server, source, cache, cookieCrumb,
    fakeuser = require('../fixtures/users').fakeuser,
    fakeusercli = require('../fixtures/users').fakeusercli;

// prepare the server
before(function (done) {
  server = require('../fixtures/setupServer')(done);

  server.ext('onPreResponse', function (request, next) {
    cache = request.server.app.cache._cache.connection.cache['|sessions'];
    source = request.response.source;
    next();
  });
});

describe('Getting to the login page', function () {
  it('renders the login page if you are not already logged in', function (done) {
    var options = {
      url: '/login'
    };

    server.inject(options, function (resp) {
      var header = resp.headers['set-cookie'];
      expect(header.length).to.equal(1);

      cookieCrumb = header[0].match(/crumb=([^\x00-\x20\"\,\;\\\x7F]*)/)[1];

      expect(resp.statusCode).to.equal(200);
      expect(source.template).to.equal('user/login');
      expect(resp.result).to.include('<input type="hidden" name="crumb" value="' + cookieCrumb + '"/>');
      done();
    });
  });

  it('redirects already authenticated users to the homepage', function (done) {
    var options = {
      url: '/login',
      credentials: fakeuser
    };

    server.inject(options, function (resp) {
      expect(resp.statusCode).to.equal(302);
      expect(resp.headers.location).to.equal('http://0.0.0.0:80/');
      done();
    });
  });

  it('renders an error if the cookie crumb is missing', function (done) {
    var options = {
      url: '/login',
      method: 'POST',
      payload: {}
    };

    server.inject(options, function (resp) {
      expect(resp.statusCode).to.equal(403);
      done();
    });
  });

  it('renders an error if one of the login fields is empty', function (done) {
    var options = {
      url: '/login',
      method: 'POST',
      payload: {
        crumb: cookieCrumb,
      },
      headers: { cookie: 'crumb=' + cookieCrumb }
    };

    server.inject(options, function (resp) {
      expect(resp.statusCode).to.equal(400);
      expect(source.template).to.equal('user/login');
      expect(source.context).to.have.deep.property('error.type', 'missing')
      done();
    });
  });

  it('renders an error if the username or password is incorrect', function (done) {
    var options = {
      url: '/login',
      method: 'POST',
      payload: {
        name: 'fakeboom',
        password: 'booooom',
        crumb: cookieCrumb,
      },
      headers: { cookie: 'crumb=' + cookieCrumb }
    };

    server.inject(options, function (resp) {
      expect(resp.statusCode).to.equal(400);
      expect(source.template).to.equal('user/login');
      expect(source.context).to.have.deep.property('error.type', 'invalid')
      done();
    });
  });

  it('redirects user to homepage if all goes well', function (done) {
    var options = {
      url: '/login',
      method: 'POST',
      payload: {
        name: 'fakeuser',
        password: '12345',
        crumb: cookieCrumb,
      },
      headers: { cookie: 'crumb=' + cookieCrumb }
    };

    server.inject(options, function (resp) {
      expect(resp.statusCode).to.equal(302);
      expect(resp.headers.location).to.equal('http://0.0.0.0:80/');
      done();
    });
  });

  it('redirects user to password page if user needs to change their password', function (done) {
    var options = {
      url: '/login',
      method: 'POST',
      payload: {
        name: 'fakeusercli',
        password: '12345',
        crumb: cookieCrumb,
      },
      headers: { cookie: 'crumb=' + cookieCrumb }
    };

    server.inject(options, function (resp) {
      expect(resp.statusCode).to.equal(302);
      expect(resp.headers.location).to.include('password');
      done();
    });
  });

});