var Code = require('code'),
    Lab = require('lab'),
    lab = exports.lab = Lab.script(),
    describe = lab.experiment,
    before = lab.before,
    after = lab.after,
    it = lab.test,
    expect = Code.expect,
    nock = require("nock"),
    users = require('../../fixtures').users;

var server, userMock;

before(function (done) {
  userMock = nock("https://user-api-example.com")
    .get("/user/bob")
    .reply(200, users.bob)
    .get("/user/lolbademail")
    .reply(200, users.bad_email);

  require('../../mocks/server')(function (obj) {
    server = obj;
    server.app.cache._cache.connection.client = {};
    done();
  });
});

after(function(done) {
  userMock.done();
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
    var opts = {
      url: '/resend-email-confirmation',
      credentials: users.bob
    };

    server.inject(opts, function (resp) {
      expect(resp.statusCode).to.equal(302);
      expect(resp.headers.location).to.equal('/profile-edit?verification-email-sent=true');
      done();
    });
  });

  it('renders an error if we were unable to send the email', function (done) {
    var opts = {
      url: '/resend-email-confirmation',
      credentials: users.bad_email
    };

    server.inject(opts, function (resp) {
      expect(resp.statusCode).to.equal(500);
      var source = resp.request.response.source;
      expect(source.template).to.equal('errors/internal');
      done();
    });
  });
});
