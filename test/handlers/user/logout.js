var generateCrumb = require("../crumb"),
  Code = require('code'),
  Lab = require('lab'),
  lab = exports.lab = Lab.script(),
  describe = lab.experiment,
  before = lab.before,
  after = lab.after,
  it = lab.test,
  expect = Code.expect,
  redis = require("../../../adapters/redis-sessions"),
  server,
  sinon = require('sinon'),
  nock = require('nock'),
  users = require('../../fixtures').users;

before(function(done) {
  require('../../mocks/server')(function(obj) {
    server = obj;
    server.methods.user.delSession = sinon.spy(server.methods.user.delSession);
    server.app.cache.drop = sinon.spy(server.app.cache.drop);
    done();
  });
});

after(function(done) {
  server.methods.user.delSession.reset();
  server.app.cache.drop.reset();
  redis.flushdb();
  server.stop(done);
});

describe('logout', function() {
  it('redirects to the homepage if there is no logged in user', function(done) {
    generateCrumb(server, function(crumb) {
      var options = {
        url: '/logout',
        method: 'POST',
        payload: {
          crumb: crumb,
        },
        headers: {
          cookie: 'crumb=' + crumb
        }
      };

      server.inject(options, function(resp) {
        expect(resp.statusCode).to.equal(302);
        expect(resp.request.response.headers.location).to.equal('/');
        done();
      });
    });
  });

  it('deletes the session for the logged in user', function(done) {
    var userMock = nock("https://user-api-example.com")
      .get("/user/bob")
      .reply(200, users.bob);

    var licenseMock = nock("https://license-api-example.com")
      .get("/customer/bob/stripe")
      .reply(404);

    generateCrumb(server, function(crumb) {
      var options = {
        url: '/logout',
        method: 'POST',
        payload: {
          crumb: crumb,
        },
        headers: {
          cookie: 'crumb=' + crumb
        },
        credentials: users.bob
      };

      options.credentials.sid = require('murmurhash').v3('bob', 55).toString(16);

      server.inject(options, function(resp) {
        userMock.done();
        licenseMock.done();
        expect(resp.statusCode).to.equal(302);
        expect(server.methods.user.delSession.called).to.be.true();
        expect(server.app.cache.drop.called).to.be.true();
        expect(resp.request.response.headers.location).to.equal('/');
        done();
      });
    });
  });
});