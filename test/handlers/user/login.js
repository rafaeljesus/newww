var generateCrumb = require("../crumb"),
    Code = require('code'),
    Lab = require('lab'),
    lab = exports.lab = Lab.script(),
    describe = lab.experiment,
    before = lab.before,
    after = lab.after,
    beforeEach = lab.beforeEach,
    afterEach = lab.afterEach,
    it = lab.test,
    expect = Code.expect,
    nock = require("nock"),
    redis = require("../../../adapters/redis-sessions"),
    server,
    users = require('../../fixtures').users;

before(function (done) {
  require('../../mocks/server')(function (obj) {
    server = obj;
    done();
  });
});

after(function (done) {
  redis.flushdb();
  server.stop(done);
});

describe('Getting to the login page', function () {
  it('renders the login page if you are not already logged in', function (done) {
    var options = {
      url: '/login'
    };

    server.inject(options, function (resp) {
      expect(resp.statusCode).to.equal(200);
      var source = resp.request.response.source;
      expect(source.template).to.equal('user/login');
      done();
    });
  });

  it('redirects already authenticated users to their profile', function (done) {
    var mock = nock("https://user-api-example.com")
      .get("/user/bob")
      .reply(200, users.bob);

    var options = {
      url: '/login',
      credentials: users.bob
    };

    server.inject(options, function (resp) {
      mock.done();
      expect(resp.statusCode).to.equal(302);
      expect(resp.headers.location).to.equal('/~bob');
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
    generateCrumb(server, function (crumb){
      var options = {
        url: '/login',
        method: 'POST',
        payload: {
          crumb: crumb,
        },
        headers: { cookie: 'crumb=' + crumb }
      };

      server.inject(options, function (resp) {
        expect(resp.statusCode).to.equal(400);
        var source = resp.request.response.source;
        expect(source.template).to.equal('user/login');
        expect(source.context.error).to.contain({ type: 'missing' });
        done();
      });
    });
  });

  it('renders an error if the username or password is incorrect', function (done) {
    generateCrumb(server, function (crumb){
      var options = {
        url: '/login',
        method: 'POST',
        payload: {
          name: 'fakeboom',
          password: 'booooom',
          crumb: crumb,
        },
        headers: { cookie: 'crumb=' + crumb }
      };

      server.inject(options, function (resp) {
        expect(resp.statusCode).to.equal(400);
        var source = resp.request.response.source;
        expect(source.template).to.equal('user/login');
        expect(source.context.error).to.match(/invalid username or password/i);
        done();
      });
    });
  });

  it('redirects user to their profile page if all goes well', function (done) {

    var name = 'bob';
    var pass = '12345';

    var mock = nock("https://user-api-example.com")
      .post("/user/" + name + "/login", {password: pass})
      .reply(200, users.bob);

    generateCrumb(server, function (crumb){
      var options = {
        url: '/login',
        method: 'POST',
        payload: {
          name: name,
          password: pass,
          crumb: crumb,
        },
        headers: { cookie: 'crumb=' + crumb }
      };

      server.inject(options, function (resp) {
        mock.done();
        expect(resp.statusCode).to.equal(302);
        expect(resp.headers.location).to.equal('/~bob');
        done();
      });
    });
  });

  it('redirects user to password page if user needs to change their password', function (done) {

    var name = 'bob';
    var pass = '12345';

    var mock = nock("https://user-api-example.com")
      .post("/user/" + name + "/login", {password: pass})
      .reply(200, users.bobUpdated);

    generateCrumb(server, function (crumb){
      var options = {
        url: '/login',
        method: 'POST',
        payload: {
          name: name,
          password: pass,
          crumb: crumb,
        },
        headers: { cookie: 'crumb=' + crumb }
      };

      server.inject(options, function (resp) {
        mock.done();
        expect(resp.statusCode).to.equal(302);
        expect(resp.headers.location).to.include('password');
        done();
      });
    });
  });

  describe("login attempts", function() {

    beforeEach(function(done) {
      redis.originalGet = redis.get;
      redis.originalIncr = redis.incr;
      done();
    });

    afterEach(function(done) {
      redis.get = redis.originalGet;
      redis.incr = redis.originalIncr;
      done();
    });

    it('renders login page and 403 if user has attempted to log in too many times', function (done) {
      var attempts = 10;
      generateCrumb(server, function (crumb){
        var options = {
          url: '/login',
          method: 'POST',
          payload: {
            name: 'fakeuser',
            password: '12345',
            crumb: crumb,
          },
          headers: { cookie: 'crumb=' + crumb }
        };

        redis.get = function(key, callback) {
          if (key === "login-attempts-fakeuser") {
            return callback(null, attempts);
          }
          return redis.originalGet(key, callback);
        };

        server.inject(options, function (resp) {
          expect(resp.statusCode).to.equal(403);
          var source = resp.request.response.source;
          expect(source.context.errors).to.exist();
          expect(source.context.errors[0].message).to.match(/Login has been disabled/i);
          done();
        });
      });
    });

    it('allows user to log in if failed attempt count exists but is within limits', function (done) {
      var attempts = 4;

      var name = 'bob';
      var pass = '12345';

      var mock = nock("https://user-api-example.com")
        .post("/user/" + name + "/login", {password: pass})
        .reply(200, users.bob);

      generateCrumb(server, function (crumb){
        var options = {
          url: '/login',
          method: 'POST',
          payload: {
            name: name,
            password: pass,
            crumb: crumb,
          },
          headers: { cookie: 'crumb=' + crumb }
        };

        redis.get = function(key, callback) {
          if (key === "login-attempts-forrest") {
            return callback(null, attempts);
          }
          return redis.originalGet(key, callback);
        };

        server.inject(options, function (resp) {
          mock.done();
          expect(resp.statusCode).to.equal(302);
          expect(resp.headers.location).to.equal('/~bob');
          done();
        });
      });
    });
  });
});
