var Lab = require('lab'),
    lab = exports.lab = Lab.script(),
    describe = lab.experiment,
    before = lab.before,
    after = lab.after,
    it = lab.test,
    expect = Lab.expect;

var server, source, cache, cookieCrumb,
    fakeuser = require('../fixtures/users').fakeuser;

before(function (done) {
  server = require('../fixtures/setupServer')(done);
  server.ext('onPreResponse', function (request, next) {
    cache = request.server.app.cache._cache.connection.cache['|sessions'];
    source = request.response.source;
    next();
  });
});

after(function (done) {
  server.app.cache._cache.connection.stop();
  done();
});

describe('billing page', function () {

  it('redirects to login page if not logged in', function (done) {
    var options = {
      url: '/settings/billing'
    }

    server.inject(options, function (resp) {
      expect(resp.statusCode).to.equal(302);
      expect(resp.headers.location).to.include('login');
      done();
    });
  });

  it('renders billing form if user is logged in', function (done) {
    var options = {
      url: '/settings/billing',
      credentials: fakeuser
    };

    server.inject(options, function (resp) {
      expect(resp.statusCode).to.equal(200);
      expect(source.template).to.equal('user/billing');
      // expect(resp.result).to.include('<input type="hidden" name="crumb" value="' + cookieCrumb + '"/>');
      done();
    });
  });

});
