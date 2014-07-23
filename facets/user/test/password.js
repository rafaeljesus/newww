var Lab = require('lab'),
    describe = Lab.experiment,
    before = Lab.before,
    it = Lab.test,
    expect = Lab.expect;

var server, source, cache, cookieCrumb,
    fakeuser = require('./fixtures/users').fakeuser,
    fakeChangePass = require('./fixtures/users').fakeuserChangePassword;

// prepare the server
before(function (done) {
  server = require('./fixtures/setupServer')(done);

  server.ext('onPreResponse', function (request, next) {
    cache = request.server.app.cache._cache.connection.cache['|sessions'];
    source = request.response.source;
    next();
  });
});

describe('Getting to the password page', function () {
  it('redirects an unauthorized user to the login page', function (done) {
    var options = {
      url: '/password'
    }

    server.inject(options, function (resp) {
      expect(resp.statusCode).to.equal(302);
      expect(resp.headers.location).to.include('login');
      done();
    });
  });

  it('takes authorized users to the password page', function (done) {
    var options = {
      url: '/password',
      credentials: fakeuser
    };

    server.inject(options, function (resp) {
      var header = resp.headers['set-cookie'];
      expect(header.length).to.equal(1);

      cookieCrumb = header[0].match(/crumb=([^\x00-\x20\"\,\;\\\x7F]*)/)[1];

      expect(resp.statusCode).to.equal(200);
      expect(source.template).to.equal('password');
      expect(resp.result).to.include('<input type="hidden" name="crumb" value="' + cookieCrumb + '"/>');
      done();
    });
  });
});

describe('Changing the password', function () {
  it('redirects an unauthorized user to the login page', function (done) {
    var options = {
      url: '/password',
      method: 'post',
      payload: fakeChangePass
    };

    server.inject(options, function (resp) {
      expect(resp.statusCode).to.equal(302);
      expect(resp.headers.location).to.include('login');
      done();
    });
  });

  it('renders an error if the cookie crumb is missing', function (done) {
    var options = {
      url: '/password',
      method: 'POST',
      payload: {},
      credentials: fakeuser,
    };

    server.inject(options, function (resp) {
      expect(resp.statusCode).to.equal(403);
      done();
    });
  });

  it('allows authorized password changes to go through', function (done) {
    var options = {
      url: '/password',
      method: 'post',
      payload: fakeChangePass,
      credentials: fakeuser,
      headers: { cookie: 'crumb=' + cookieCrumb }
    };

    options.payload.crumb = cookieCrumb;

    server.inject(options, function (resp) {
      // console.log(resp)
      expect(resp.statusCode).to.equal(302);
      expect(resp.headers.location).to.include('profile');
      done();
    });

  });
});