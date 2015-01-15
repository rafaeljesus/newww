var Code = require('code'),
    Lab = require('lab'),
    lab = exports.lab = Lab.script(),
    describe = lab.experiment,
    before = lab.before,
    after = lab.after,
    beforeEach = lab.beforeEach,
    afterEach = lab.afterEach,
    it = lab.test,
    expect = Code.expect,
    nock = require("nock");

var fixtures = {
  users: require("../fixtures/users")
};

var User = new (require("../../models/user"))({
  host: "https://user.com"
});

describe("User", function(){

  describe("initialization", function() {

    it("defaults to process.env.USER_API as host", function(done) {
      var USER_API_OLD = process.env.USER_API
      process.env.USER_API = "https://envy.com/"
      expect(new (require("../../models/user"))().host).to.equal('https://envy.com/')
      process.env.USER_API = USER_API_OLD
      done()
    })

    it("accepts a custom host", function(done) {
      expect(User.host).to.equal('https://user.com')
      done()
    })

  })

  describe("get()", function() {

    it("makes an external request for /{user}", function(done) {
      var userMock = nock(User.host)
        .get('/fakeuser')
        .reply(200, fixtures.users.fakeuser);

      User.get(fixtures.users.fakeuser.name, function(err, body) {
        expect(err).to.be.null()
        userMock.done()
        done()
      })
    })

    it("returns the response body in the callback", function(done) {
      var userMock = nock(User.host)
        .get('/fakeuser')
        .reply(200, fixtures.users.fakeuser);

      User.get(fixtures.users.fakeuser.name, function(err, body) {
        expect(err).to.be.null()
        expect(body.name).to.equal("fakeuser")
        expect(body.email).to.exist()
        userMock.done()
        done()
      })
    })

    it("returns an error in the callback if the request failed", function(done) {
      var userMock = nock(User.host)
        .get('/foo')
        .reply(404);

      User.get('foo', function(err, body) {
        expect(err).to.exist();
        expect(err.message).to.equal("error getting user foo");
        expect(err.statusCode).to.equal(404);
        userMock.done()
        done();
      })
    })

    it("does not require a bearer token", function(done) {
      var userMock = nock(User.host, {reqheaders: {}})
        .get('/dogbreath')
        .reply(200);

      User.get('dogbreath', function(err, body) {
        userMock.done()
        done()
      })
    })

    it("allows loading user stars and packages too", function(done) {

      var userMock = nock(User.host)
        .get('/eager-beaver')
        .reply(200, {
          name: "eager-beaver",
          email: "eager-beaver@example.com"
        });

      var starMock = nock(User.host)
        .get('/eager-beaver/stars')
        .reply(200, [
          'minimist',
          'hapi'
        ]);

      var packageMock = nock(User.host)
        .get('/eager-beaver/package?format=mini')
        .reply(200, [
          {name: "foo", description: "It's a foo!"},
          {name: "bar", description: "It's a bar!"}
        ]);

      User.get('eager-beaver', {stars: true, packages: true}, function(err, user) {
        expect(err).to.not.exist()
        userMock.done()
        packageMock.done()
        starMock.done()
        expect(user.name).to.equal('eager-beaver')
        expect(user.email).to.equal('eager-beaver@example.com')
        expect(user.packages).to.be.an.array()
        expect(user.stars).to.be.an.array()
        done()
      })

    })

  })

  describe("getPackages()", function() {

    it("makes an external request for /{user}/package", function(done) {
      var packageMock = nock(User.host)
        .get('/fakeuser/package?format=mini')
        .reply(200, []);

      User.getPackages(fixtures.users.fakeuser.name, function(err, body) {
        packageMock.done()
        expect(err).to.be.null()
        expect(body).to.exist()
        done()
      })
    })

    it("returns the response body in the callback", function(done) {
      var packageMock = nock(User.host)
        .get('/fakeuser/package?format=mini')
        .reply(200, [
          {name: "foo", description: "It's a foo!"},
          {name: "bar", description: "It's a bar!"}
        ]);

      User.getPackages(fixtures.users.fakeuser.name, function(err, body) {
        expect(err).to.be.null()
        expect(body).to.be.an.array()
        expect(body[0].name).to.equal("foo")
        expect(body[1].name).to.equal("bar")
        packageMock.done()
        done()
      })
    })

    it("returns an error in the callback if the request failed", function(done) {
      var packageMock = nock(User.host)
        .get('/foo/package?format=mini')
        .reply(404);

      User.getPackages('foo', function(err, body) {
        expect(err).to.exist();
        expect(err.message).to.equal("error getting packages for user foo");
        expect(err.statusCode).to.equal(404);
        done();
      })
    })

    it("includes bearer token in request header", function(done) {
      var packageMock = nock(User.host, {
          reqheaders: {bearer: 'sally'}
        })
        .get('/sally/package?format=mini')
        .reply(200, [
          {name: "foo", description: "It's a foo!"},
          {name: "bar", description: "It's a bar!"}
        ]);

      User.getPackages('sally', function(err, body) {
        packageMock.done()
        done()
      })
    })

  })

  describe("getStars()", function() {

    it("makes an external request for /{user}/stars", function(done) {
      var starMock = nock(User.host)
        .get('/bcoe/stars')
        .reply(200, ['lodash', 'nock', 'yargs']);

      User.getStars('bcoe', function(err, body) {
        starMock.done()
        expect(err).to.be.null()
        expect(body).to.exist()
        done()
      })
    })

    it("returns the response body in the callback", function(done) {
      var starMock = nock(User.host)
        .get('/ceej/stars')
        .reply(200, ['blade', 'minimist']);

      User.getStars('ceej', function(err, body) {
        expect(err).to.be.null()
        expect(body).to.be.an.array()
        expect(body[0]).to.equal("blade")
        expect(body[1]).to.equal("minimist")
        starMock.done()
        done()
      })
    })

    it("returns an error in the callback if the request failed", function(done) {
      var starMock = nock(User.host)
        .get('/zeke/stars')
        .reply(404);

      User.getStars('zeke', function(err, body) {
        starMock.done()
        expect(err).to.exist();
        expect(err.message).to.equal("error getting stars for user zeke");
        expect(err.statusCode).to.equal(404);
        done();
      })
    })

    it("includes bearer token in request header", function(done) {
      var starMock = nock(User.host, {
          reqheaders: {bearer: 'rod11'}
        })
        .get('/rod11/stars')
        .reply(200);

      User.getStars('rod11', function(err, body) {
        starMock.done()
        done()
      })
    })

  })


})
