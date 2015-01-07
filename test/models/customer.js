var Lab = require('lab'),
    lab = exports.lab = Lab.script(),
    describe = lab.experiment,
    before = lab.before,
    beforeEach = lab.beforeEach,
    after = lab.after,
    it = lab.test,
    expect = Lab.expect,
    nock = require("nock"),
    Customer = new(require("../../models/customer"));

var fixtures = {
  users: require("../fixtures/users")
};

describe("Customer", function(){

  it("has a default host", function(done) {
    expect(Customer.host).to.equal("https://billing-api-example.com")
    done()
  })

  describe("get()", function() {

    it("makes an external request for /stripe/{user}", function(done) {
      var customerMock = nock(Customer.host)
        .get('/stripe/fakeuser')
        .reply(200, fixtures.users.fakeuser);

      Customer.get(fixtures.users.fakeuser.name, function(err, body) {
        expect(err).to.be.null
        customerMock.done()
        done()
      })
    })

    it("returns the response body in the callback", function(done) {
      var customerMock = nock(Customer.host)
        .get('/stripe/fakeuser')
        .reply(200, fixtures.users.fakeuser);

      Customer.get(fixtures.users.fakeuser.name, function(err, body) {
        expect(err).to.be.null
        expect(body).to.be.an.object
        customerMock.done()
        done()
      })
    })

    it("returns an error in the callback if the request failed", function(done) {
      var packageMock = nock(Customer.host)
        .get('/stripe/foo')
        .reply(404);

      Customer.get('foo', function(err, body) {
        expect(err).to.exist;
        expect(err.message).to.equal("error getting user foo");
        expect(err.statusCode).to.equal(404);
        done();
      })
    })

  })

  describe("update()", function() {

    // it("makes an external request for /{user}/package", function(done) {
    //   var packageMock = nock(Customer.host)
    //     .get('/fakeuser/package?format=mini')
    //     .reply(200, []);
    //
    //   Customer.getPackages(fixtures.users.fakeuser.name, function(err, body) {
    //     packageMock.done()
    //     expect(err).to.be.null
    //     expect(body).to.exist
    //     done()
    //   })
    // })
    //
    // it("returns the response body in the callback", function(done) {
    //   var packageMock = nock(Customer.host)
    //     .get('/fakeuser/package?format=mini')
    //     .reply(200, [
    //       {name: "foo", description: "It's a foo!"},
    //       {name: "bar", description: "It's a bar!"}
    //     ]);
    //
    //   Customer.getPackages(fixtures.users.fakeuser.name, function(err, body) {
    //     expect(err).to.be.null
    //     expect(body).to.be.an.array
    //     expect(body[0].name).to.equal("foo")
    //     expect(body[1].name).to.equal("bar")
    //     packageMock.done()
    //     done()
    //   })
    // })
    //
    // it("returns an error in the callback if the request failed", function(done) {
    //   var packageMock = nock(Customer.host)
    //     .get('/foo/package?format=mini')
    //     .reply(404);
    //
    //   Customer.getPackages('foo', function(err, body) {
    //     expect(err).to.exist;
    //     expect(err.message).to.equal("error getting packages for user foo");
    //     expect(err.statusCode).to.equal(404);
    //     done();
    //   })
    // })

  })


})
