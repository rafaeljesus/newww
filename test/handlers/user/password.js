var generateCrumb = require("../crumb"),
    Code = require('code'),
    Lab = require('lab'),
    lab = exports.lab = Lab.script(),
    describe = lab.experiment,
    before = lab.before,
    after = lab.after,
    it = lab.test,
    expect = Code.expect,
    nock = require("nock"),
    redisSessions = require('../../../adapters/redis-sessions');

var server, userMock,
    users = require('../../fixtures').users;


before(function (done) {

  userMock = nock("https://user-api-example.com")
    .get("/user/bob").times(3)
    .reply(200, users.bob)
    .post("/user/bob")
    .reply(200, users.bob)
    .post("/user/bob/login", {password: '12345'}).twice()
    .reply(200, users.bob)
    .post("/user/" + users.bob.name + "/login", {password: 'abcde'})
    .reply(200, users.bob)
    .post("/user/" + users.bob.name, {"name":"bob","password":"abcde","mustChangePass":false})
    .reply(200, users.bob);

  require('../../mocks/server')(function (obj) {
    server = obj;
    done();
  });
});

after(function (done) {
  userMock.done();
  server.stop(done);
});

describe('Getting to the password page', function () {
  it('redirects an unauthorized user to the login page', function (done) {
    var options = {
      url: '/password'
    };

    server.inject(options, function (resp) {
      expect(resp.statusCode).to.equal(302);
      expect(resp.headers.location).to.include('login');
      done();
    });
  });

  it('takes authorized users to the password page', function (done) {
    var options = {
      url: '/password',
      credentials: users.bob
    };

    server.inject(options, function (resp) {
      expect(resp.statusCode).to.equal(200);
      var source = resp.request.response.source;
      expect(source.template).to.equal('user/password');
      done();
    });
  });
});

describe('Changing the password', function () {

  it('redirects an unauthorized user to the login page', function (done) {
    var options = {
      url: '/password',
      method: 'post',
      payload: users.changePass
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
      credentials: users.bob,
    };

    server.inject(options, function (resp) {
      expect(resp.statusCode).to.equal(403);
      done();
    });
  });

  it('renders an error if unable to drop sessions for the user', function (done) {

    // mock out drop keys method
    var oldDropKeys = redisSessions.dropKeysWithPrefix;
    redisSessions.dropKeysWithPrefix = function (name, cb) {
      return cb(new Error('redis is borken'));
    };

    generateCrumb(server, function (crumb){
      var options = {
        url: '/password',
        method: 'post',
        payload: users.changePass,
        credentials: users.bob,
        headers: { cookie: 'crumb=' + crumb }
      };

      options.payload.crumb = crumb;

      server.inject(options, function (resp) {
        expect(resp.statusCode).to.equal(500);
        var source = resp.request.response.source;
        expect(source.template).to.include('errors/internal');

        redisSessions.dropKeysWithPrefix = oldDropKeys;
        done();
      });
    });
  });

  it('allows authorized password changes to go through', function (done) {

    // mock out drop keys method
    var oldDropKeys = redisSessions.dropKeysWithPrefix;
    redisSessions.dropKeysWithPrefix = function (name, cb) {
      return cb(null);
    };

    generateCrumb(server, function (crumb){
      var options = {
        url: '/password',
        method: 'post',
        payload: users.changePass,
        credentials: users.bob,
        headers: { cookie: 'crumb=' + crumb }
      };

      options.payload.crumb = crumb;

      server.inject(options, function (resp) {
        expect(resp.statusCode).to.equal(302);
        expect(resp.headers.location).to.include('profile');
        redisSessions.dropKeysWithPrefix = oldDropKeys;
        done();
      });
    });
  });
});
