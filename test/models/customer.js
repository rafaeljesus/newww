var Code = require('code'),
    Lab = require('lab'),
    lab = exports.lab = Lab.script(),
    describe = lab.experiment,
    beforeEach = lab.beforeEach,
    before = lab.before,
    after = lab.after,
    it = lab.test,
    expect = Code.expect,
    nock = require("nock"),
    fixtures = require('../fixtures');

var CustomerModel = require("../../models/customer");

var LICENSE_API_OLD;
before(function (done) {
  LICENSE_API_OLD = process.env.LICENSE_API;
  process.env.LICENSE_API = "https://customer.com";
  done();
});

after(function (done) {
  process.env.LICENSE_API = LICENSE_API_OLD;
  done();
});

describe("Customer", function(){

  describe("initialization", function() {

    it("defaults to process.env.LICENSE_API as host", function(done) {
      expect(new CustomerModel().host).to.equal('https://customer.com');
      done();
    });

    it("accepts a custom host", function(done) {
      var url = "https://billing-envy.com";
      var Customer = new CustomerModel('boom', {
        host: url,
      });

      expect(Customer.host).to.equal(url);
      done();
    });

  });

  describe("get()", function() {

    it("makes an external request for /customer/{user}", function(done) {
      var Customer = new CustomerModel('haxor');

      var customerMock = nock(Customer.host)
        .get('/customer/haxor')
        .reply(200, fixtures.customers.happy);

      Customer.get(function(err, body) {
        customerMock.done();
        expect(err).to.be.null();
        done();
      });
    });

    it("returns the response body in the callback", function(done) {
      var Customer = new CustomerModel('zozo');

      var customerMock = nock(Customer.host)
        .get('/customer/zozo')
        .reply(200, fixtures.customers.happy);

      Customer.get(function(err, body) {
        customerMock.done();
        expect(err).to.be.null();
        expect(body).to.be.an.object();
        done();
      });
    });

    it("returns an error in the callback if customer doesn't exist", function(done) {
      var Customer = new CustomerModel('foo');

      var customerMock = nock(Customer.host)
        .get('/customer/foo')
        .reply(404);

      Customer.get(function(err, body) {
        customerMock.done();
        expect(err).to.exist();
        expect(err.message).to.equal("customer not found: foo");
        expect(err.statusCode).to.equal(404);
        done();
      });
    });

  });

  describe("update()", function() {

    describe("new customer", function() {
      var billingInfo;
      var Customer;

      beforeEach(function(done) {
        Customer = new CustomerModel('bob');

        billingInfo = {
          name: "bob",
          email: "bob@domain.com",
          card: "1234567890"
        };
        done();
      });

      it("makes an external request for /stripe/{user}", function(done) {
        var customerMock = nock(Customer.host)
          .get('/customer/bob')
          .reply(404)
          .put('/stripe', billingInfo)
          .reply(200, fixtures.customers.happy);

        Customer.update(billingInfo, function(err, body) {
          customerMock.done();
          expect(err).to.be.null();
          expect(body).to.exist();
          done();
        });
      });

      it("gets customer data back in callback body", function(done) {
        var customerMock = nock(Customer.host)
          .get('/customer/bob')
          .reply(404)
          .put('/stripe', billingInfo)
          .reply(200, fixtures.customers.happy);

        Customer.update(billingInfo, function(err, customer) {
          customerMock.done();
          expect(err).to.be.null();
          expect(customer).to.exist();
          expect(customer.email).to.equal("bencoe@gmail.com");
          done();
        });
      });

      it("errors if name is missing", function(done){
        delete billingInfo.name;
        Customer.update(billingInfo, function(err, customer) {
          expect(err).to.exist();
          expect(err.message).to.equal("name is a required property");
          done();
        });
      });

      it("errors if email is missing", function(done){
        delete billingInfo.email;
        Customer.update(billingInfo, function(err, customer) {
          expect(err).to.exist();
          expect(err.message).to.equal("email is a required property");
          done();
        });
      });

      it("errors if card is missing", function(done){
        delete billingInfo.card;
        Customer.update(billingInfo, function(err, customer) {
          expect(err).to.exist();
          expect(err.message).to.equal("card is a required property");
          done();
        });
      });

      it("errors if the card is invalid", function(done) {
        var createCustomerMock = nock(Customer.host)
          .get('/customer/bob')
          .reply(200, {})
          .post('/customer/bob/stripe', billingInfo)
          .reply(200, "Your card's security code is incorrect.");

        Customer.update(billingInfo, function (err, customer) {
          createCustomerMock.done();
          expect(err).to.exist();
          expect(err.message).to.equal("Your card's security code is incorrect.");
          done();
        });
      });
    });
  });

  describe("del()", function() {
    it("cancels a user's subscription", function (done) {
        var Customer = new CustomerModel('bob');
        var createCustomerMock = nock(Customer.host)
          .delete('/customer/bob/stripe')
          .reply(200, 'customer deleted');

        Customer.del(function (err, response) {
          createCustomerMock.done();
          expect(err).to.not.exist();
          expect(response).to.equal("customer deleted");
          done();
        });
    });
  });


});
