var Code = require('code'),
    Lab = require('lab'),
    lab = exports.lab = Lab.script(),
    describe = lab.experiment,
    before = lab.before,
    after = lab.after,
    it = lab.test,
    expect = Code.expect,
    nock = require("nock"),
    mocks = require('../../helpers/mocks'),
    users = require('../../fixtures').users;

var server, userMock;

before(function (done) {
  require('../../mocks/server')(function (obj) {
    server = obj;
    server.app.cache._cache.connection.client = {};
    done();
  });
});

after(function(done) {
  server.stop(function () {
    done();
  });
});

describe('Request to resend confirmation email', function () {

  it('redirects to login if user is not already logged in', function (done) {
    var opts = {
      url: '/resend-email-confirmation'
    };

    server.inject(opts, function (resp) {
      expect(resp.statusCode).to.equal(302);
      expect(resp.headers.location).to.equal('/login');
      done();
    });
  });

  it('sends an email & takes the user to the /profile-edit page without any errors', function (done) {
    var userMock = mocks.loggedInPaidUser('bob');
    var opts = {
      url: '/resend-email-confirmation',
      credentials: users.bob
    };

    server.inject(opts, function (resp) {
      userMock.done();
      expect(resp.statusCode).to.equal(302);
      expect(resp.headers.location).to.equal('/profile-edit?verification-email-sent=true');
      done();
    });
  });

  it('renders an error if we were unable to send the email', function (done) {
    var userMock = mocks.loggedInUnpaidUser(users.bad_email);
    var opts = {
      url: '/resend-email-confirmation',
      credentials: users.bad_email
    };

    server.inject(opts, function (resp) {
      userMock.done();
      expect(resp.statusCode).to.equal(500);
      var source = resp.request.response.source;
      expect(source.template).to.equal('errors/internal');
      done();
    });
  });
});
