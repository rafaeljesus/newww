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
    users = require('../../fixtures').users;

before(function (done) {
  require('../../mocks/server')(function (obj) {
    server = obj;
    server.methods.user.delSession = sinon.spy(server.methods.user.delSession);
    done();
  });
});

after(function (done) {
  server.methods.user.delSession.reset();
  redis.flushdb();
  server.stop(done);
});

describe('logout', function () {
  it('redirects to the homepage if there is no logged in user', function (done) {
    generateCrumb(server, function (crumb) {
      var options = {
        url: '/logout',
        method: 'POST',
        payload: {
          crumb: crumb,
        },
        headers: { cookie: 'crumb=' + crumb }
      };

      server.inject(options, function (resp) {
        expect(resp.statusCode).to.equal(302);
        expect(resp.request.response.headers.location).to.equal('/');
        done();
      });
    });
  });

  it('deletes the session for the logged in user', function (done) {
    generateCrumb(server, function (crumb) {
      var options = {
        url: '/logout',
        method: 'POST',
        payload: {
          crumb: crumb,
        },
        headers: { cookie: 'crumb=' + crumb },
        credentials: users.bob
      };

      server.inject(options, function (resp) {
        expect(resp.statusCode).to.equal(302);
        expect(server.methods.user.delSession.called).to.be.true();
        expect(resp.request.response.headers.location).to.equal('/');
        done();
      });
    });
  });
});