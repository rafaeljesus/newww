var Lab = require('lab'),
    lab = exports.lab = Lab.script(),
    describe = lab.experiment,
    before = lab.before,
    beforeEach = lab.beforeEach,
    after = lab.after,
    it = lab.test,
    expect = Lab.expect,
    nock = require("nock"),
    User = new(require("../../models/user"));

var fixtures = {
  users: require("../fixtures/users")
};

describe("User", function(){

  it("has a default host", function(done) {
    expect(User.host).to.equal("https://user-api-example.com")
    done()
  })

  describe("get()", function() {

    it("makes an external request for /{user}", function(done) {
      var userMock = nock(User.host)
        .get('/fakeuser')
        .reply(200, fixtures.users.fakeuser);

      User.get(fixtures.users.fakeuser.name, function(err, body) {
        expect(err).to.be.null
        userMock.done()
        done()
      })
    })

    it("returns the response body in the callback", function(done) {
      var userMock = nock(User.host)
        .get('/fakeuser')
        .reply(200, fixtures.users.fakeuser);

      User.get(fixtures.users.fakeuser.name, function(err, body) {
        expect(err).to.be.null
        expect(body.name).to.equal("fakeuser")
        expect(body.email).to.exist
        userMock.done()
        done()
      })
    })

    it("returns an error in the callback if the request failed", function(done) {
      var packageMock = nock(User.host)
        .get('/foo')
        .reply(404);

      User.get('foo', function(err, body) {
        expect(err).to.exist;
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
        expect(err).to.be.null
        expect(body).to.exist
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
        expect(err).to.be.null
        expect(body).to.be.an.array
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
        expect(err).to.exist;
        expect(err.message).to.equal("error getting packages for user foo");
        expect(err.statusCode).to.equal(404);
        done();
      })
    })

  })


})
