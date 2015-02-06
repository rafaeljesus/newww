var Code = require('code'),
    Lab = require('lab'),
    lab = exports.lab = Lab.script(),
    describe = lab.experiment,
    beforeEach = lab.beforeEach,
    afterEach = lab.afterEach,
    it = lab.test,
    expect = Code.expect,
    nock = require("nock");

var fixtures = {
  users: require("../fixtures/users")
};

var User;

beforeEach(function (done) {
  User = new (require("../../models/user"))({
    host: "https://user.com"
  });
  done();
});

afterEach(function (done) {
  User = null;
  done();
});

describe("User", function(){

  describe("initialization", function() {
    it("defaults to process.env.USER_API as host", function(done) {
      var USER_API_OLD = process.env.USER_API;
      process.env.USER_API = "https://envy.com/";
      expect(new (require("../../models/user"))().host).to.equal('https://envy.com/');
      process.env.USER_API = USER_API_OLD;
      done();
    });

    it("accepts a custom host", function(done) {
      expect(User.host).to.equal('https://user.com');
      done();
    });

  });

  describe("login", function () {

    it("makes an external request for /{user}/login", function (done) {
      var userMock = nock(User.host)
        .post('/user/fakeuser/login')
        .reply(200, fixtures.users.fakeuser);

      var loginInfo = {
        name: 'fakeuser',
        password: '12345'
      };

      User.login(loginInfo, function (err, user) {
        expect(err).to.be.null();
        expect(user).to.exist();
        userMock.done();
        done();
      });
    });

  });

  describe("get()", function() {

    it("makes an external request for /{user}", function(done) {
      var userMock = nock(User.host)
        .get('/user/bob')
        .reply(200, fixtures.users.fakeuser);

      User.get(fixtures.users.fakeuser.name, function(err, body) {
        expect(err).to.be.null();
        expect(body).to.exist();
        userMock.done();
        done();
      });
    });

    it("returns the response body in the callback", function(done) {
      var userMock = nock(User.host)
        .get('/user/bob')
        .reply(200, fixtures.users.fakeuser);

      User.get(fixtures.users.fakeuser.name, function(err, body) {
        expect(err).to.be.null();
        expect(body.name).to.equal("bob");
        expect(body.email).to.exist();
        userMock.done();
        done();
      });
    });

    it("returns an error in the callback if the request failed", function(done) {
      var userMock = nock(User.host)
        .get('/user/foo')
        .reply(404);

      User.get('foo', function(err, body) {
        expect(err).to.exist();
        expect(err.message).to.equal("error getting user foo");
        expect(err.statusCode).to.equal(404);
        expect(body).to.not.exist();
        userMock.done();
        done();
      });
    });

    it("does not require a bearer token", function(done) {
      var userMock = nock(User.host, {reqheaders: {}})
        .get('/user/dogbreath')
        .reply(200);

      User.get('dogbreath', function(err, body) {
        expect(err).to.be.null();
        expect(body).to.exist();
        userMock.done();
        done();
      });
    });

    it("allows loading user stars and packages too", function(done) {

      var userMock = nock(User.host)
        .get('/user/eager-beaver')
        .reply(200, {
          name: "eager-beaver",
          email: "eager-beaver@example.com"
        });

      var starMock = nock(User.host)
        .get('/user/eager-beaver/stars')
        .reply(200, [
          'minimist',
          'hapi'
        ]);

      var packageMock = nock(User.host)
        .get('/user/eager-beaver/package?per_page=9999')
        .reply(200, [
          {name: "foo", description: "It's a foo!"},
          {name: "bar", description: "It's a bar!"}
        ]);

      User.get('eager-beaver', {stars: true, packages: true}, function(err, user) {
        expect(err).to.not.exist();
        userMock.done();
        packageMock.done();
        starMock.done();
        expect(user.name).to.equal('eager-beaver');
        expect(user.email).to.equal('eager-beaver@example.com');
        expect(user.packages).to.be.an.array();
        expect(user.stars).to.be.an.array();
        done();
      });

    });

    it("includes the bearer token if user is logged in when loading user stars and packages", function(done) {

      User = new (require("../../models/user"))({
        host: "https://user.com",
        bearer: "rockbot"
      });

      var userMock = nock(User.host)
        .get('/user/eager-beaver')
        .reply(200, {
          name: "eager-beaver",
          email: "eager-beaver@example.com"
        });

      var starMock = nock(User.host, {
          reqheaders: {bearer: 'rockbot'}
        })
        .get('/user/eager-beaver/stars')
        .reply(200, [
          'minimist',
          'hapi'
        ]);

      var packageMock = nock(User.host, {
          reqheaders: {bearer: 'rockbot'}
        })
        .get('/user/eager-beaver/package?per_page=9999')
        .reply(200, [
          {name: "foo", description: "It's a foo!"},
          {name: "bar", description: "It's a bar!"}
        ]);

      User.get('eager-beaver', {stars: true, packages: true}, function(err, user) {
        expect(err).to.not.exist();
        userMock.done();
        packageMock.done();
        starMock.done();
        expect(user.name).to.equal('eager-beaver');
        expect(user.email).to.equal('eager-beaver@example.com');
        expect(user.packages).to.be.an.array();
        expect(user.stars).to.be.an.array();
        done();
      });

    });

  });

  describe("getPackages()", function() {

    it("makes an external request for /{user}/package", function(done) {
      var packageMock = nock(User.host)
        .get('/user/bob/package?per_page=9999')
        .reply(200, []);

      User.getPackages(fixtures.users.fakeuser.name, function(err, body) {
        packageMock.done();
        expect(err).to.be.null();
        expect(body).to.exist();
        done();
      });
    });

    it("returns the response body in the callback", function(done) {
      var packageMock = nock(User.host)
        .get('/user/bob/package?per_page=9999')
        .reply(200, [
          {name: "foo", description: "It's a foo!"},
          {name: "bar", description: "It's a bar!"}
        ]);

      User.getPackages(fixtures.users.fakeuser.name, function(err, body) {
        expect(err).to.be.null();
        expect(body).to.be.an.array();
        expect(body[0].name).to.equal("foo");
        expect(body[1].name).to.equal("bar");
        packageMock.done();
        done();
      });
    });

    it("returns an error in the callback if the request failed", function(done) {
      var packageMock = nock(User.host)
        .get('/user/foo/package?per_page=9999')
        .reply(404);

      User.getPackages('foo', function(err, body) {
        expect(err).to.exist();
        expect(err.message).to.equal("error getting packages for user foo");
        expect(err.statusCode).to.equal(404);
        expect(body).to.not.exist();
        packageMock.done();
        done();
      });
    });

    it("includes bearer token in request header if user is logged in", function(done) {

      User = new (require("../../models/user"))({
        host: "https://user.com",
        bearer: "sally"
      });

      var packageMock = nock(User.host, {
          reqheaders: {bearer: 'sally'}
        })
        .get('/user/sally/package?per_page=9999')
        .reply(200, [
          {name: "foo", description: "It's a foo!"},
          {name: "bar", description: "It's a bar!"}
        ]);

      User.getPackages('sally', function(err, body) {
        expect(err).to.be.null();
        expect(body).to.exist();
        packageMock.done();
        done();
      });
    });

    it("does not include bearer token in request header if user is not logged in", function(done) {
      var packageMock = nock(User.host)
        .get('/user/sally/package?per_page=9999')
        .reply(200, [
          {name: "foo", description: "It's a foo!"},
          {name: "bar", description: "It's a bar!"}
        ]);

      User.getPackages('sally', function(err, body) {
        expect(err).to.be.null();
        expect(body).to.exist();
        packageMock.done();
        done();
      });
    });
  });

  describe("getStars()", function() {

    it("makes an external request for /{user}/stars", function(done) {
      var starMock = nock(User.host)
        .get('/user/bcoe/stars')
        .reply(200, ['lodash', 'nock', 'yargs']);

      User.getStars('bcoe', function(err, body) {
        starMock.done();
        expect(err).to.be.null();
        expect(body).to.exist();
        done();
      });
    });

    it("returns the response body in the callback", function(done) {
      var starMock = nock(User.host)
        .get('/user/ceej/stars')
        .reply(200, ['blade', 'minimist']);

      User.getStars('ceej', function(err, body) {
        expect(err).to.be.null();
        expect(body).to.be.an.array();
        expect(body[0]).to.equal("blade");
        expect(body[1]).to.equal("minimist");
        starMock.done();
        done();
      });
    });

    it("returns an error in the callback if the request failed", function(done) {
      var starMock = nock(User.host)
        .get('/user/zeke/stars')
        .reply(404);

      User.getStars('zeke', function(err, body) {
        starMock.done();
        expect(err).to.exist();
        expect(err.message).to.equal("error getting stars for user zeke");
        expect(err.statusCode).to.equal(404);
        expect(body).to.not.exist();
        done();
      });
    });

    it("includes bearer token in request header if user is logged in", function(done) {

      User = new (require("../../models/user"))({
        host: "https://user.com",
        bearer: "rod11"
      });

      var starMock = nock(User.host, {
          reqheaders: {bearer: 'rod11'}
        })
        .get('/user/rod11/stars')
        .reply(200, 'something');

      User.getStars('rod11', function(err, body) {
        expect(err).to.be.null();
        expect(body).to.exist();
        starMock.done();
        done();
      });
    });

    it("does not include bearer token in request header if user is not logged in", function(done) {
      var starMock = nock(User.host)
        .get('/user/rod11/stars')
        .reply(200, 'something');

      User.getStars('rod11', function(err, body) {
        expect(err).to.be.null();
        expect(body).to.exist();
        starMock.done();
        done();
      });
    });
  });

  describe("lookup users by email", function () {
    it("returns an error for invalid email addresses", function (done) {
      User.lookupEmail('barf', function (err, usernames) {
        expect(err).to.exist();
        expect(err.statusCode).to.equal(400);
        expect(usernames).to.be.undefined();
        done();
      });
    });

    it("returns an array of email addresses", function (done) {
      var lookupMock = nock(User.host)
        .get('/user/ohai@boom.com')
        .reply(200, ['user', 'user2']);

      User.lookupEmail('ohai@boom.com', function (err, usernames) {
        expect(err).to.not.exist();
        expect(usernames).to.be.an.array();
        expect(usernames[0]).to.equal('user');
        expect(usernames[1]).to.equal('user2');
        lookupMock.done();
        done();
      });
    });

    it("passes any errors on to the controller", function (done) {
      var lookupMock = nock(User.host)
        .get('/user/ohai@boom.com')
        .reply(400, []);

      User.lookupEmail('ohai@boom.com', function (err, usernames) {
        expect(err).to.exist();
        expect(err.statusCode).to.equal(400);
        expect(usernames).to.not.exist();
        lookupMock.done();
        done();
      });
    });
  });

  describe("signup", function () {
    var signupInfo = {
      name: 'hello',
      password: '12345',
      email: 'hello@hi.com'
    };

    var userObj = {
      name: signupInfo.name
    };

    it("passes any errors along", function (done) {
      var signupMock = nock(User.host)
        .put('/user', signupInfo)
        .reply(400);

      User.signup(signupInfo, function (err, user) {
        expect(err).to.exist();
        expect(err.statusCode).to.equal(400);
        expect(user).to.not.exist();
        signupMock.done();
        done();
      });
    });

    it("returns a user object when successful", function (done) {
      var signupMock = nock(User.host)
        .put('/user', signupInfo)
        .reply(200, userObj);

      User.signup(signupInfo, function (err, user) {
        expect(err).to.not.exist();
        expect(user).to.exist();
        expect(user.name).to.equal(signupInfo.name);
        signupMock.done();
        done();
      });
    });
  });

  describe("save", function () {
    var profile = {
      name: "npmjs",
      resources: {
        twitter: "npmjs",
        github: ""
      }
    };

    var userObj = {
      name: "npmjs",
      email: "support@npmjs.com",
      resources: {
        twitter: "npmjs",
        github: ""
      }
    };

    it("bubbles up any errors that might occur", function (done) {
      var saveMock = nock(User.host)
        .post('/user/npmjs', profile)
        .reply(400);

      User.save(profile, function (err, user) {
        expect(err).to.exist();
        expect(err.statusCode).to.equal(400);
        expect(user).to.not.exist();
        saveMock.done();
        done();
      });
    });

    it("hits the save url", function (done) {
      var saveMock = nock(User.host)
        .post('/user/npmjs', profile)
        .reply(200, userObj);

      User.save(profile, function (err, user) {
        expect(err).to.not.exist();
        expect(user).to.exist();
        expect(user.name).to.equal('npmjs');
        expect(user.email).to.equal('support@npmjs.com');
        saveMock.done();
        done();
      });
    });
  });
});
