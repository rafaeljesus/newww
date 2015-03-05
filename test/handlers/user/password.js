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

var server,
    users = require('../../fixtures').users;

// prepare the server
before(function (done) {
  require('../../mocks/server')(function (obj) {
    server = obj;
    done();
  });
});

after(function (done) {
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

  // mock out drop keys method
  var oldDropKeys;
  before(function (done) {
    oldDropKeys = redisSessions.dropKeysWithPrefix;
    redisSessions.dropKeysWithPrefix = function (name, cb) {

      if (name === 'fakeusercli') {
        return cb(new Error('redis is borken'));
      }

      return cb(null);
    };

    done();
  });

  // un-mock it for other tests :-)
  after(function (done) {
    redisSessions.dropKeysWithPrefix = oldDropKeys;
    done();
  });

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

    var name = "fakeusercli";

    var mock = nock("https://user-api-example.com")
      .post("/user/" + name + "/login", {password: '12345'})
      .reply(200, users.bob)
      .post("/user/" + name)
      .reply(200, users.bob);

    generateCrumb(server, function (crumb){
      var options = {
        url: '/password',
        method: 'post',
        payload: users.changePass,
        credentials: users.bob,
        headers: { cookie: 'crumb=' + crumb }
      };

      // force redis error
      options.credentials.name = name;

      options.payload.crumb = crumb;

      server.inject(options, function (resp) {
        mock.done();
        expect(resp.statusCode).to.equal(500);
        var source = resp.request.response.source;
        expect(source.template).to.include('errors/internal');

        // undo the damage from earlier
        users.bob.name = 'bob';
        done();
      });
    });
  });

  it('allows authorized password changes to go through', function (done) {

    var mock = nock("https://user-api-example.com")
      .post("/user/" + users.bob.name + "/login", {password: '12345'})
      .reply(200, users.bob)
      .post("/user/" + users.bob.name + "/login", {password: 'abcde'})
      .reply(200, users.bob)
      .post("/user/" + users.bob.name, {"name":"bob","password":"abcde","mustChangePass":false})
      .reply(200, users.bob);

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
        mock.done();
        expect(resp.statusCode).to.equal(302);
        expect(resp.headers.location).to.include('profile');
        done();
      });
    });
  });
});
