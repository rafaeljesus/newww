var generateCrumb = require("../crumb"),
  Code = require('code'),
  Lab = require('lab'),
  lab = exports.lab = Lab.script(),
  describe = lab.experiment,
  before = lab.before,
  after = lab.after,
  it = lab.test,
  expect = Code.expect,
  nock = require("nock");

var server,
  users = require('../../fixtures').users;

before(function(done) {
  require('../../mocks/server')(function(obj) {
    server = obj;
    done();
  });
});

after(function(done) {
  server.stop(done);
});

describe('Tokens', function() {

  describe('getting to the page with cli tokens', function() {
    it('redirects an unauthorized user to the login page', function(done) {
      var options = {
        url: '/settings/tokens'
      };

      server.inject(options, function(resp) {
        expect(resp.statusCode).to.equal(302);
        expect(resp.headers.location).to.include('login');
        done();
      });
    });

    it('shows authorized users their cli tokens (if they have them)', function(done) {
      var userMock = nock("https://user-api-example.com")
        .get("/user/bob")
        .reply(200, users.bob)
        .get("/user/bob/tokens")
        .reply(200, users.bobTokens);

      var licenseMock = nock("https://license-api-example.com")
        .get("/customer/bob/stripe")
        .reply(404);

      var options = {
        url: '/settings/tokens',
        credentials: users.bob
      };

      server.inject(options, function(resp) {
        userMock.done();
        licenseMock.done();
        expect(resp.statusCode).to.equal(200);
        var source = resp.request.response.source;
        expect(source.context.tokens).to.deep.equal(users.bobTokens);
        expect(source.template).to.equal('user/tokens');
        done();
      });
    });

    it('takes authorized users to the cli token page even if there is an error', function(done) {
      var userMock = nock("https://user-api-example.com")
        .get("/user/bob")
        .reply(200, users.bob)
        .get("/user/bob/tokens")
        .reply(404);

      var licenseMock = nock("https://license-api-example.com")
        .get("/customer/bob/stripe")
        .reply(404);

      var options = {
        url: '/settings/tokens',
        credentials: users.bob
      };

      server.inject(options, function(resp) {
        userMock.done();
        licenseMock.done();
        expect(resp.statusCode).to.equal(200);
        var source = resp.request.response.source;
        expect(source.context.tokens).to.deep.equal([]);
        expect(source.template).to.equal('user/tokens');
        done();
      });
    });
  });

  describe('deleting a session token', function() {
    it('removes a session token if a user chooses to', function(done) {
      var token = users.bobTokens[0].token;

      var userMock = nock("https://user-api-example.com")
        .get("/user/bob")
        .reply(200, users.bob)
        .post("/user/-/logout", {
          "auth_token": token,
        })
        .reply(200, users.bobTokens);

      var licenseMock = nock("https://license-api-example.com")
        .get("/customer/bob/stripe")
        .reply(404);

      generateCrumb(server, function(crumb) {

        var options = {
          url: '/settings/token/' + token,
          method: 'POST',
          credentials: users.bob,
          payload: {
            crumb: crumb,
            updateType: 'deleteToken'
          },
          headers: {
            cookie: 'crumb=' + crumb
          }
        };

        server.inject(options, function(resp) {
          userMock.done();
          licenseMock.done();
          expect(resp.statusCode).to.equal(302);
          expect(resp.headers.location).to.include('settings/tokens');
          done();
        });
      });
    });

    it('shows an error if there is a problem', function(done) {
      var token = users.bobTokens[0].token;

      var userMock = nock("https://user-api-example.com")
        .get("/user/bob")
        .reply(200, users.bob)
        .post("/user/-/logout", {
          "auth_token": token,
        })
        .reply(400);

      var licenseMock = nock("https://license-api-example.com")
        .get("/customer/bob/stripe")
        .reply(404);

      generateCrumb(server, function(crumb) {

        var options = {
          url: '/settings/token/' + token,
          method: 'POST',
          credentials: users.bob,
          payload: {
            crumb: crumb,
            updateType: 'deleteToken'
          },
          headers: {
            cookie: 'crumb=' + crumb
          }
        };

        server.inject(options, function(resp) {
          userMock.done();
          licenseMock.done();
          expect(resp.statusCode).to.equal(302);
          expect(resp.headers.location).to.include('settings/tokens?notice=');
          done();
        });
      });
    });
  });

});