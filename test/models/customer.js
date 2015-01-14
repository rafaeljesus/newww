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

var Customer = new (require("../../models/customer"))({
  host: "https://customer.com"
});

var fixtures = {
  customers: {
    happy: require("../fixtures/customers/happy"),
    license_expired: require("../fixtures/customers/license_expired")
  }
};

describe("Customer", function(){

  describe("initialization", function() {

    it("defaults to BILLING_API as host", function(done) {
      var BILLING_API_OLD = process.env.BILLING_API
      process.env.BILLING_API = "https://billing-envy.com/"
      expect(new (require("../../models/customer"))().host).to.equal('https://billing-envy.com/')
      process.env.BILLING_API = BILLING_API_OLD
      done()
    })

    it("accepts a custom host", function(done) {
      expect(Customer.host).to.equal('https://customer.com')
      done()
    })

  })

  describe("get()", function() {

    it("makes an external request for /stripe/{user}", function(done) {
      var customerMock = nock(Customer.host)
        .get('/stripe/haxor')
        .reply(200, fixtures.customers.happy);

      Customer.get('haxor', function(err, body) {
        customerMock.done()
        expect(err).to.be.null()
        done()
      })
    })

    it("returns the response body in the callback", function(done) {
      var customerMock = nock(Customer.host)
        .get('/stripe/zozo')
        .reply(200, fixtures.customers.happy);

      Customer.get('zozo', function(err, body) {
        customerMock.done()
        expect(err).to.be.null()
        expect(body).to.be.an.object()
        done()
      })
    })

    it("returns an error in the callback if customer doesn't exist", function(done) {
      var customerMock = nock(Customer.host)
        .get('/stripe/foo')
        .reply(404);

      Customer.get('foo', function(err, body) {
        customerMock.done()
        expect(err).to.exist();
        expect(err.message).to.equal("customer not found: foo");
        expect(err.statusCode).to.equal(404);
        done();
      })
    })

  })

  describe("update()", function() {

    describe("new customer", function() {
      var billingInfo

      beforeEach(function(done) {
        billingInfo = {
          name: "bob",
          email: "bob@domain.com",
          card: "1234567890"
        }
        done()
      })

      it("makes an external request for /stripe/{user}", function(done) {
        var getCustomerMock = nock(Customer.host)
          .get('/stripe/bob')
          .reply(404);

        var createCustomerMock = nock(Customer.host)
          .put('/stripe', billingInfo)
          .reply(200, fixtures.customers.happy);

        Customer.update(billingInfo, function(err, body) {
          getCustomerMock.done()
          createCustomerMock.done()
          expect(err).to.be.null()
          expect(body).to.exist()
          done()
        })
      })

      it("gets customer data back in callback body", function(done) {
        var getCustomerMock = nock(Customer.host)
          .get('/stripe/bob')
          .reply(404);

        var createCustomerMock = nock(Customer.host)
          .put('/stripe', billingInfo)
          .reply(200, fixtures.customers.happy);

        Customer.update(billingInfo, function(err, customer) {
          getCustomerMock.done()
          createCustomerMock.done()
          expect(err).to.be.null()
          expect(customer).to.exist()
          expect(customer.email).to.equal("bencoe@gmail.com")
          done()
        })
      })

      it("errors if name is missing", function(done){
        delete billingInfo.name
        Customer.update(billingInfo, function(err, customer) {
          expect(err).to.exist()
          expect(err.message).to.equal("name is a required property")
          done()
        })
      })


    })
    //
    // describe("existing customer"), function() {
    //
    // }

    //
    // it("returns the response body in the callback", function(done) {
    //   var customerMock = nock(Customer.host)
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
    //     customerMock.done()
    //     done()
    //   })
    // })
    //
    // it("returns an error in the callback if the request failed", function(done) {
    //   var customerMock = nock(Customer.host)
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
