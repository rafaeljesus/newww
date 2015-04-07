var generateCrumb = require("../handlers/crumb.js"),
    Code = require('code'),
    Lab = require('lab'),
    lab = exports.lab = Lab.script(),
    describe = lab.experiment,
    before = lab.before,
    after = lab.after,
    it = lab.test,
    expect = Code.expect,
    nock = require('nock'),
    fixtures = require('../fixtures');

var server, packageMock, userMock,
    pkg = 'fake',
    user = fixtures.users.bob;

before(function (done) {
  nock.cleanAll();

  packageMock = nock("https://user-api-example.com")
    .put("/package/" + pkg + "/star")
    .reply(200)
    .delete("/package/" + pkg + "/star")
    .reply(200);

  userMock = nock("https://user-api-example.com")
    .get("/user/bob").times(3)
    .reply(200, user);

  require('../mocks/server')(function (obj) {
    server = obj;
    done();
  });
});

after(function (done) {
  packageMock.done();
  userMock.done();
  server.stop(done);
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
    generateCrumb(server, function (crumb){
      var opts = {
        url: '/star',
        method: 'POST',
        payload: {
          name: pkg,
          isStarred: 'true',
          crumb: crumb
        },
        headers: { cookie: 'crumb=' + crumb }
      };

      server.inject(opts, function (resp) {
        expect(resp.statusCode).to.equal(403);
        expect(resp.result).to.equal('user is not logged in');
        done();
      });
    });
  });

  it('should star an unstarred package', function (done) {

    generateCrumb(server, function (crumb){
      var opts = {
        url: '/star',
        method: 'POST',
        payload: {
          name: pkg,
          isStarred: 'true',
          crumb: crumb
        },
        credentials: user,
        headers: { cookie: 'crumb=' + crumb }
      };

      server.inject(opts, function (resp) {
        expect(resp.statusCode).to.equal(200);
        expect(resp.result).to.equal(user.name + ' starred ' + pkg);
        done();
      });
    });
  });

  it('should unstar an starred package', function (done) {

    generateCrumb(server, function (crumb){
      var opts = {
        url: '/star',
        method: 'POST',
        payload: {
          name: pkg,
          isStarred: 'false',
          crumb: crumb
        },
        credentials: user,
        headers: { cookie: 'crumb=' + crumb }
      };

      server.inject(opts, function (resp) {
        expect(resp.statusCode).to.equal(200);
        expect(resp.result).to.equal(user.name + ' unstarred ' + pkg);
        done();
      });
    });
  });
});
