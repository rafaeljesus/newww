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

    it("defaults to USER_API as host", function(done) {
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
      var packageMock = nock(User.host)
        .get('/foo')
        .reply(404);

      User.get('foo', function(err, body) {
        expect(err).to.exist();
        expect(err.message).to.equal("error getting user foo");
        expect(err.statusCode).to.equal(404);
        done();
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

  })

})
