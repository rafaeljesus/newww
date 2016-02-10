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

var LICENSE_API = "https://license-api-example.com";

var CustomerAgent = require("../../agents/customer");

describe("Customer", function() {

  describe("initialization", function() {

    it("doesn't break if we forget the `new` keyword", function(done) {
      var Customer = CustomerAgent('bob');
      expect(Customer.name).to.equal('bob');
      done();
    });

  });

  describe("getStripeData()", function() {

    it("makes an external request for /customer/{user}", function(done) {
      var Customer = new CustomerAgent('haxor');

      var customerMock = nock(LICENSE_API)
        .get('/customer/haxor/stripe')
        .reply(200, fixtures.customers.happy);

      Customer.getStripeData(function(err, body) {
        customerMock.done();
        expect(err).to.be.null();
        done();
      });
    });

    it("returns the response body in the callback", function(done) {
      var Customer = new CustomerAgent('zozo');

      var customerMock = nock(LICENSE_API)
        .get('/customer/zozo/stripe')
        .reply(200, fixtures.customers.happy);

      Customer.getStripeData(function(err, body) {
        customerMock.done();
        expect(err).to.be.null();
        expect(body).to.be.an.object();
        done();
      });
    });

    it("returns an error in the callback if customer doesn't exist", function(done) {
      var Customer = new CustomerAgent('foo');

      var customerMock = nock(LICENSE_API)
        .get('/customer/foo/stripe')
        .reply(404);

      Customer.getStripeData(function(err, body) {
        customerMock.done();
        expect(err).to.exist();
        expect(err.message).to.equal("Customer not found: foo");
        expect(err.statusCode).to.equal(404);
        done();
      });
    });

    it("returns an error if a bad request is sent", function(done) {
      var Customer = new CustomerAgent('ഊ');

      var customerMock = nock(LICENSE_API)
        .get('/customer/ഊ/stripe')
        .reply(400, 'bad request');

      Customer.getStripeData(function(err, body) {
        customerMock.done();
        expect(err).to.exist();
        expect(err.message).to.equal("bad request");
        expect(err.statusCode).to.equal(400);
        done();
      });
    });

  });

  describe("getSubscriptions()", function() {
    it('returns an empty array if no subscriptions are found', function(done) {
      var Customer = new CustomerAgent('bob');

      var customerMock = nock(LICENSE_API)
        .get('/customer/bob/stripe/subscription')
        .reply(404);

      Customer.getSubscriptions(function(err, subs) {
        customerMock.done();
        expect(err).to.be.null();
        expect(subs).to.be.an.array();
        expect(subs).to.be.empty();
        done();
      });
    });

    describe('returns a cleaned up version of subscription data', function(done) {
      var subscriptions;

      before(function(done) {
        var Customer = new CustomerAgent('bob');

        var customerMock = nock(LICENSE_API)
          .get('/customer/bob/stripe/subscription')
          .reply(200, fixtures.customers.subscriptions.faultyBob);

        Customer.getSubscriptions(function(err, subs) {
          customerMock.done();
          expect(err).to.be.null();
          expect(subs).to.be.an.array();
          subscriptions = subs;
          done();
        });
      });

      it('filters out bad data', function(done) {
        expect(subscriptions).to.be.length(1);
        expect(subscriptions[0]).to.include('npm_org');
        expect(subscriptions[0].product_id).to.not.be.null();
        done();
      });

      it('includes next billing date in each subscription', function(done) {
        expect(subscriptions[0].next_billing_date).to.exist();
        done();
      });

      it('identifies private modules subscriptions', function(done) {
        expect(subscriptions[0].privateModules).to.be.true();
        done();
      });

    });
  });

  describe("getById(id)", function() {

    it("makes an external request for /customer/{user}", function(done) {
      var Customer = new CustomerAgent('bill');

      var customerMock = nock(LICENSE_API)
        .get('/customer/316')
        .reply(200, fixtures.customers.bill);

      Customer.getById(316, function(err, body) {
        customerMock.done();
        expect(err).to.be.null();
        done();
      });
    });

    it("returns an error in the callback if customer doesn't exist", function(done) {
      var Customer = new CustomerAgent('bill');

      var customerMock = nock(LICENSE_API)
        .get('/customer/999')
        .reply(404);

      Customer.getById(999, function(err, body) {
        customerMock.done();
        expect(err).to.exist();
        expect(err.message).to.equal("Customer not found");
        expect(err.statusCode).to.equal(404);
        done();
      });
    });

    it("returns the response body in the callback", function(done) {
      var Customer = new CustomerAgent('bill');

      var customerMock = nock(LICENSE_API)
        .get('/customer/316')
        .reply(200, fixtures.customers.bill);

      Customer.getById(316, function(err, body) {
        customerMock.done();
        expect(err).to.be.null();
        expect(body).to.be.an.object();
        expect(body.stripe_customer_id).to.equal("cus_6SOufuJcDjz2yx");
        done();
      });
    });

  });

  describe("createCustomer()", function() {
    describe('creating a customer', function() {
      it('returns a customer when one is created', function(done) {
        var Customer = new CustomerAgent('');

        var data = {
          email: 'boom@bam.com',
          firstname: 'Boom',
          lastname: 'Bam',
          phone: '123-456-7890'
        };

        var dataIn = {
          email: data.email,
          name: data.firstname + ' ' + data.lastname,
          phone: data.phone
        };

        var customerMock = nock(LICENSE_API)
          .put('/customer', dataIn)
          .reply(200, data);

        Customer.createCustomer(data, function(err, customer) {
          customerMock.done();
          expect(err).to.not.exist();
          expect(customer).to.deep.equal(data);
          done();
        });
      });

      it('returns an error when creating a customer fails', function(done) {
        var Customer = new CustomerAgent('');

        var data = {
          email: 'boom@bam.com',
          firstname: 'Boom',
          lastname: 'Bam',
          phone: '123-456-7890'
        };

        var dataIn = {
          email: data.email,
          name: data.firstname + ' ' + data.lastname,
          phone: data.phone
        };

        var customerMock = nock(LICENSE_API)
          .put('/customer', dataIn)
          .reply(400, 'unable to create customer');

        Customer.createCustomer(data, function(err, customer) {
          customerMock.done();
          expect(err).to.exist();
          expect(err.message).to.equal('unable to create customer');
          expect(customer).to.not.exist();
          done();
        });
      });

    });
  });

  describe("creating a license", function() {
    var licenseData = {
      "customer_id": 12345,
      "stripe_subscription_id": "cust_12345",
      "seats": 5,
      "begins": "2016-02-04T11:30:36-08:00",
      "ends": "2017-02-04T11:30:36-08:00"
    };

    var dataIn = {
      billingEmail: 'exists@boom.com',
      seats: 5,
      stripeId: 'cust_12345',
      begins: '2016-02-04T11:30:36-08:00',
      ends: '2017-02-04T11:30:36-08:00'
    };

    it('returns a license when one is created', function(done) {
      var Customer = new CustomerAgent();

      var mock = nock(LICENSE_API)
        .get('/customer/exists@boom.com')
        .reply(200, fixtures.enterprise.existingUser)
        .put('/license', licenseData)
        .reply(200, fixtures.enterprise.goodLicense);

      Customer.createOnSiteLicense(dataIn, function(err, license) {
        mock.done();
        expect(err).to.not.exist();
        expect(license).to.deep.equal(fixtures.enterprise.goodLicense);
        done();
      });
    });

    it('returns an error when license creation fails', function(done) {
      var Customer = new CustomerAgent();

      var mock = nock(LICENSE_API)
        .get('/customer/' + dataIn.billingEmail)
        .reply(200, fixtures.enterprise.existingUser)
        .put('/license', licenseData)
        .reply(400, 'bad request');

      Customer.createOnSiteLicense(dataIn, function(err, license) {
        mock.done();
        expect(err).to.exist();
        expect(err.message).to.equal('bad request');
        expect(err.statusCode).to.equal(400);
        expect(license).to.not.exist();
        done();
      });
    });

    it('returns an error when a customer is not found', function(done) {
      var Customer = new CustomerAgent();

      var mock = nock(LICENSE_API)
        .get('/customer/' + dataIn.billingEmail)
        .reply(400);

      Customer.createOnSiteLicense(dataIn, function(err, license) {
        mock.done();
        expect(err).to.exist();
        expect(err.message).to.equal('could not create license for unknown customer with email ' + dataIn.billingEmail);
        expect(license).to.not.exist();
        done();
      });
    });
  });

  describe("getting an on-site license", function() {
    it('returns the license if it is found', function(done) {

      var productId = '12-34-56',
        customerId = '12345',
        licenseId = fixtures.enterprise.onSiteLicense.details.license_key;

      var mock = nock(LICENSE_API)
        .get('/license/' + productId + '/' + customerId + '/' + licenseId)
        .reply(200, fixtures.enterprise.onSiteLicense);

      new CustomerAgent().getOnSiteLicense(productId, customerId, licenseId, function(err, license) {
        mock.done();
        expect(err).to.not.exist();
        expect(license).to.be.an.object();
        expect(license.license_key).to.equal(licenseId);
        done();
      });
    });

    it('returns nothing if not found', function(done) {

      var productId = '12-34-56',
        customerId = '12345',
        licenseId = 'd89355a5-859b-43f4-8d8d-12b661403314';

      var mock = nock(LICENSE_API)
        .get('/license/' + productId + '/' + customerId + '/' + licenseId)
        .reply(404);

      new CustomerAgent().getOnSiteLicense(productId, customerId, licenseId, function(err, license) {
        mock.done();
        expect(err).to.be.null();
        expect(license).to.be.null();
        done();
      });
    });

    it('returns en error if something goes wrong in the user-acl', function(done) {

      var productId = '12-34-56',
        customerId = '12345',
        licenseId = fixtures.enterprise.onSiteLicense.details.license_key;

      var mock = nock(LICENSE_API)
        .get('/license/' + productId + '/' + customerId + '/' + licenseId)
        .reply(400, 'bad request');

      new CustomerAgent().getOnSiteLicense(productId, customerId, licenseId, function(err, license) {
        mock.done();
        expect(err).to.exist();
        expect(err.message).to.equal('bad request');
        expect(license).to.not.exist();
        done();
      });
    });
  });

  describe("getting all on-site licenses", function() {
    it('returns the licenses if they are found', function(done) {

      var productId = '12-34-56',
        customerId = '12345';

      var licenseMock = nock(LICENSE_API)
        .get('/license/' + productId + '/' + customerId)
        .reply(200, {
          licenses: ['1234-5678-90']
        });

      new CustomerAgent().getAllOnSiteLicenses(productId, customerId, function(err, licenses) {
        licenseMock.done();
        expect(err).to.not.exist();
        expect(licenses).to.be.an.array();
        expect(licenses[0]).to.equal('1234-5678-90');
        done();
      });
    });

    it('returns nothing if they are not found', function(done) {

      var productId = '12-34-56',
        customerId = '12345';

      var licenseMock = nock(LICENSE_API)
        .get('/license/' + productId + '/' + customerId)
        .reply(404);

      new CustomerAgent().getAllOnSiteLicenses(productId, customerId, function(err, licenses) {
        licenseMock.done();
        expect(err).to.be.null();
        expect(licenses).to.be.null();
        done();
      });
    });

    it('returns en error if something goes wrong in the license api', function(done) {

      var productId = '12-34-56',
        customerId = '12345';

      var licenseMock = nock(LICENSE_API)
        .get('/license/' + productId + '/' + customerId)
        .reply(400, 'bad request');

      new CustomerAgent().getAllOnSiteLicenses(productId, customerId, function(err, licenses) {
        licenseMock.done();
        expect(err).to.exist();
        expect(err.message).to.equal('bad request');
        expect(licenses).to.not.exist();
        done();
      });
    });
  });

  describe("creating a trial", function() {
    var productId;
    var TRIAL_LENGTH = 30;
    var TRIAL_SEATS = 50;

    before(function(done) {
      process.env.NPME_PRODUCT_ID = '12345-12345-12345';
      productId = process.env.NPME_PRODUCT_ID;
      done();
    });

    after(function(done) {
      delete process.env.NPME_PRODUCT_ID;
      done();
    });

    it('creates a new trial if one does not exist', function(done) {
      var customer = {
        id: '23456',
        email: 'new@bam.com'
      };

      var customerMock = nock(LICENSE_API)
        .get('/trial/' + productId + '/' + customer.email)
        .reply(404, 'not found')
        .put('/trial', {
          customer_id: customer.id,
          product_id: productId,
          length: TRIAL_LENGTH,
          seats: TRIAL_SEATS
        })
        .reply(200, {
          id: '54321'
        });

      new CustomerAgent().createOnSiteTrial(customer, function(err, trial) {
        customerMock.done();
        expect(err).to.not.exist();
        expect(trial).to.exist();
        expect(trial.id).to.equal('54321');
        done();
      });
    });

    it('returns an existing trial if it already exists', function(done) {
      var customer = {
        id: '23456',
        email: 'existing@bam.com'
      };

      var customerMock = nock(LICENSE_API)
        .log(console.log)
        .get('/trial/' + productId + '/' + customer.email)
        .reply(200, {
          id: 'abcde'
        });

      new CustomerAgent().createOnSiteTrial(customer, function(err, trial) {
        customerMock.done();
        expect(err).to.not.exist();
        expect(trial).to.exist();
        expect(trial.id).to.equal('abcde');
        done();
      });
    });

    it('returns an error if looking up trial info fails', function(done) {
      var customer = {
        id: '23456',
        email: 'error@bam.com'
      };

      var customerMock = nock(LICENSE_API)
        .get('/trial/' + productId + '/' + customer.email)
        .reply(400, 'bad request');

      new CustomerAgent().createOnSiteTrial(customer, function(err, trial) {
        customerMock.done();
        expect(err).to.exist();
        expect(trial).to.not.exist();
        expect(err.message).to.equal('bad request');
        done();
      });
    });

    it('returns an error if creating a trial fails', function(done) {
      var customer = {
        id: '23456',
        email: 'error@bam.com'
      };

      var customerMock = nock(LICENSE_API)
        .get('/trial/' + productId + '/' + customer.email)
        .reply(404)
        .put('/trial', {
          customer_id: customer.id,
          product_id: productId,
          length: TRIAL_LENGTH,
          seats: TRIAL_SEATS
        })
        .reply(400, 'bad request');

      new CustomerAgent().createOnSiteTrial(customer, function(err, trial) {
        customerMock.done();
        expect(err).to.exist();
        expect(trial).to.not.exist();
        expect(err.message).to.equal('bad request');
        done();
      });
    });
  });

  describe("updateBilling()", function() {

    describe("new customer", function() {
      var billingInfo;
      var Customer;

      beforeEach(function(done) {
        Customer = new CustomerAgent('bob');

        billingInfo = {
          name: "bob",
          email: "bob@domain.com",
          card: "1234567890"
        };
        done();
      });

      it("makes an external request for /stripe/{user}", function(done) {
        var customerMock = nock(LICENSE_API)
          .get('/customer/bob/stripe')
          .reply(404)
          .put('/customer/stripe', billingInfo)
          .reply(200, fixtures.customers.happy);

        Customer.updateBilling(billingInfo, function(err, body) {
          customerMock.done();
          expect(err).to.be.null();
          expect(body).to.exist();
          done();
        });
      });

      it("gets customer data back in callback body", function(done) {
        var customerMock = nock(LICENSE_API)
          .get('/customer/bob/stripe')
          .reply(404)
          .put('/customer/stripe', billingInfo)
          .reply(200, fixtures.customers.happy);

        Customer.updateBilling(billingInfo, function(err, customer) {
          customerMock.done();
          expect(err).to.be.null();
          expect(customer).to.exist();
          expect(customer.email).to.equal("bencoe@gmail.com");
          done();
        });
      });

      it("errors if name is missing", function(done) {
        delete billingInfo.name;
        Customer.updateBilling(billingInfo, function(err, customer) {
          expect(err).to.exist();
          expect(err.message).to.equal("name is a required property");
          done();
        });
      });

      it("errors if email is missing", function(done) {
        delete billingInfo.email;
        Customer.updateBilling(billingInfo, function(err, customer) {
          expect(err).to.exist();
          expect(err.message).to.equal("email is a required property");
          done();
        });
      });

      it("errors if card is missing", function(done) {
        delete billingInfo.card;
        Customer.updateBilling(billingInfo, function(err, customer) {
          expect(err).to.exist();
          expect(err.message).to.equal("card is a required property");
          done();
        });
      });

      it("errors if the card is invalid", function(done) {
        var createCustomerMock = nock(LICENSE_API)
          .get('/customer/bob/stripe')
          .reply(200, {})
          .post('/customer/bob/stripe', billingInfo)
          .reply(200, "Your card's security code is incorrect.");

        Customer.updateBilling(billingInfo, function(err, customer) {
          createCustomerMock.done();
          expect(err).to.exist();
          expect(err.message).to.equal("Your card's security code is incorrect.");
          done();
        });
      });
    });
  });

  describe("del()", function() {
    it("cancels a user's subscription", function(done) {
      var Customer = new CustomerAgent('bob');
      var createCustomerMock = nock(LICENSE_API)
        .delete('/customer/bob/stripe')
        .reply(200, 'customer deleted');

      Customer.del(function(err, response) {
        createCustomerMock.done();
        expect(err).to.not.exist();
        expect(response).to.equal("customer deleted");
        done();
      });
    });
  });

  describe("createSubscription()", function() {
    it("signs a user up for private modules", function(done) {
      var Customer = new CustomerAgent('bob');
      var planInfo = {
        plan: 'npm-paid-individual-user-7'
      };
      var customerMock = nock(LICENSE_API)
        .put('/customer/bob/stripe/subscription', planInfo)
        .reply(200, {
          id: 'sub_12345',
          current_period_end: 1436995358,
          current_period_start: 1434403358,
          quantity: 1,
          status: 'active',
          interval: 'month',
          amount: 700,
          license_id: 1,
          npm_org: '_private-modules-bob',
          npm_user: 'bob',
          product_id: '1031405a-70b7-4a3f-b552-8609d9e1428f'
        });

      Customer.createSubscription(planInfo, function(err, subscription) {
        customerMock.done();
        expect(err).to.not.exist();
        expect(subscription.id).to.equal('sub_12345');
        expect(subscription.npm_org).to.equal('_private-modules-bob');
        done();
      });

    });

    it("signs a user up for an org", function(done) {
      var Customer = new CustomerAgent('bob');
      var planInfo = {
        plan: 'npm-paid-org-7'
      };
      var customerMock = nock(LICENSE_API)
        .put('/customer/bob/stripe/subscription', planInfo)
        .reply(200, {
          id: 'sub_12346',
          current_period_end: 1436995358,
          current_period_start: 1434403358,
          quantity: 2,
          status: 'active',
          interval: 'month',
          amount: 1200,
          license_id: 1,
          npm_org: 'bigco',
          npm_user: 'bob',
          product_id: '1031405a-70b7-4a3f-b552-8609d9e1428e'
        });
      Customer.createSubscription(planInfo, function(err, subscription) {
        customerMock.done();
        expect(err).to.not.exist();
        expect(subscription.id).to.equal('sub_12346');
        expect(subscription.npm_org).to.equal('bigco');
        done();
      });
    });

  });

  describe("getLicenseForOrg", function() {
    it('returns an error if customer does not exist', function(done) {
      var Customer = new CustomerAgent('bob');
      var customerMock = nock(LICENSE_API)
        .get('/customer/bob/stripe/subscription?org=bigco')
        .reply(404);

      Customer.getLicenseForOrg('bigco', function(err, license) {
        customerMock.done();
        expect(err).to.exist();
        expect(err.message).to.equal('Customer not found');
        expect(license).to.not.exist();
        done();
      });
    });

    it('returns empty array if no license exists for passed org', function(done) {
      var Customer = new CustomerAgent('bob');
      var customerMock = nock(LICENSE_API)
        .get('/customer/bob/stripe/subscription?org=bigco')
        .reply(200, []);

      Customer.getLicenseForOrg('bigco', function(err, license) {
        customerMock.done();
        expect(err).to.be.null();
        expect(license.length).to.equal(0);
        done();
      });
    }) ;


    it('gets the license for an org', function(done) {
      var Customer = new CustomerAgent('bob');
      var customerMock = nock(LICENSE_API)
        .get('/customer/bob/stripe/subscription?org=bigco')
        .reply(200, [{
          "amount": 700,
          "cancel_at_period_end": false,
          "current_period_end": 1451324640,
          "current_period_start": 1448732640,
          "id": "sub_6sc",
          "interval": "month",
          "license_id": 1,
          "npm_org": "bigco",
          "npm_user": "bob",
          "product_id": "b5822d32",
          "quantity": 8,
          "status": "active"
        }]);

      Customer.getLicenseForOrg('bigco', function(err, license) {
        customerMock.done();
        expect(err).to.be.null();
        expect(license[0].license_id).to.equal(1);
        done();
      });
    });
  });

  describe("getAllSponsorships", function() {
    //TODO: handle error cases
    it('has error when string is passed for licenseId', function(done) {
      var Customer = new CustomerAgent('bob');
      var customerMock = nock(LICENSE_API)
        .get('/sponsorship/asdbadbb')
        .reply(500, "invalid input syntax for integer: \"asdbadbb\"");

      Customer.getAllSponsorships('asdbadbb', function(err, sponsorships) {
        customerMock.done();
        expect(err).to.exist();
        expect(err.statusCode).to.equal(500);
        expect(err.message).to.equal("invalid input syntax for integer: \"asdbadbb\"");
        done();
      });
    });

    it('gets all sponsorships for an organization', function(done) {
      var Customer = new CustomerAgent('bob');
      var customerMock = nock(LICENSE_API)
        .get('/sponsorship/123')
        .reply(200, [
          {
            "id": 10,
            "license_id": 123,
            "npm_user": "bob",
            "verification_key": "1031405a-70b7-4a3f-b553-8609d9e4428e",
            "verified": true,
            "created": "2015-07-28T18:42:00.623Z",
            "updated": "2015-07-28T18:42:00.715Z",
            "deleted": null
          }
        ]);

      Customer.getAllSponsorships(123, function(err, sponsorships) {
        customerMock.done();
        expect(err).to.be.null();
        expect(sponsorships).to.be.an.array();
        expect(sponsorships[0].license_id).to.equal(123);
        expect(sponsorships[0].npm_user).to.equal('bob');
        done();
      });
    });
  });

  describe("extendSponsorship", function() {
    it("throws an error if licenseId doesn't exist", function(done) {
      var Customer = new CustomerAgent('bob');
      var customerMock = nock(LICENSE_API)
        .put('/sponsorship/11111', {
          npm_user: "boomer"
        })
        .reply(404);

      Customer.extendSponsorship(11111, "boomer", function(err, sponsorships) {
        customerMock.done();
        expect(err).to.exist();
        expect(err.message).to.equal("The sponsorship license number 11111 is not found");
        expect(err.statusCode).to.equal(404);

        done();
      });
    });

    it("creates a sponsorship for a user", function(done) {
      var Customer = new CustomerAgent('bob');
      var customerMock = nock(LICENSE_API)
        .put('/sponsorship/123', {
          npm_user: "boomer"
        })
        .reply(200, [
          {
            "created": "2015-07-28T18:42:00.623Z",
            "deleted": null,
            "id": 10,
            "license_id": 20,
            "npm_user": "boomer",
            "updated": "2015-07-28T18:42:00.715Z",
            "verification_key": "e640f651-ef53-4560-86a6-34cae5a38e15",
            "verified": null
          }
        ]);

      Customer.extendSponsorship(123, "boomer", function(err, sponsorships) {
        customerMock.done();
        expect(err).to.be.null();
        expect(sponsorships).to.be.an.array();
        expect(sponsorships[0].license_id).to.equal(20);
        expect(sponsorships[0].npm_user).to.equal("boomer");
        done();
      });
    });
  });

  describe("acceptSponsorship", function() {
    it('returns an error if the verification key is invalid', function(done) {
      var verification_key = '4aboom';

      var Customer = new CustomerAgent('bob');
      var customerMock = nock(LICENSE_API)
        .post('/sponsorship/' + verification_key)
        .reply(404);

      Customer.acceptSponsorship(verification_key, function(err, verifiedUser) {
        customerMock.done();
        expect(err).to.exist();
        expect(err.message).to.equal('The verification key used for accepting this sponsorship does not exist');
        expect(verifiedUser).to.not.exist();
        done();
      });
    });

    it('does not return an error if the user is already sponsored', function(done) {
      var verification_key = 'e640f651-ef53-4560-86a6-34cae5a38e20';

      var Customer = new CustomerAgent('bob');
      var customerMock = nock(LICENSE_API)
        .post('/sponsorship/' + verification_key)
        .reply(409, "duplicate key value violates unique constraint \"sponsorships_npm_user\"");

      Customer.acceptSponsorship(verification_key, function(err, verifiedUser) {
        customerMock.done();
        expect(err).to.be.null();
        done();
      });
    });

    it('accepts a sponsorship with a valid verification key', function(done) {
      var verification_key = 'e640f651-ef53-4560-86a6-34cae5a38e15';

      var Customer = new CustomerAgent('bob');
      var customerMock = nock(LICENSE_API)
        .post('/sponsorship/' + verification_key)
        .reply(200, {
          "id": 10,
          "license_id": 20,
          "npm_user": "boomer",
          "verification_key": verification_key,
          "verified": true,
          "created": "2015-07-29T14:13:04.826Z",
          "updated": "2015-07-29T14:13:16.206Z",
          "deleted": null
        });

      Customer.acceptSponsorship(verification_key, function(err, verifiedUser) {
        customerMock.done();
        expect(err).to.not.exist();
        expect(verifiedUser.verification_key).to.equal(verification_key);
        expect(verifiedUser.verified).to.be.true();
        done();
      });
    });
  });

  describe('removeSponsorship', function() {
    it('returns an error if the user is not found', function(done) {
      var Customer = new CustomerAgent('bob');
      var customerMock = nock(LICENSE_API)
        .delete('/sponsorship/20/notfound')
        .reply(404);

      Customer.removeSponsorship("notfound", 20, function(err, removedUser) {
        customerMock.done();
        expect(err).to.exist();
        expect(err.message).to.equal('user or licenseId not found');
        expect(removedUser).to.not.exist();
        done();
      });
    });

    it('removes the sponsorship for a valid user', function(done) {
      var Customer = new CustomerAgent('bob');
      var customerMock = nock(LICENSE_API)
        .delete('/sponsorship/20/boomer')
        .reply(200, {
          "id": 10,
          "license_id": 20,
          "npm_user": "boomer",
          "verification_key": "e640f651-ef53-4560-86a6-34cae5a38e15",
          "verified": true,
          "created": "2015-07-29T14:13:04.826Z",
          "updated": "2015-07-29T14:13:16.206Z",
          "deleted": "2015-07-29T14:53:01.243Z"
        });

      Customer.removeSponsorship("boomer", 20, function(err, removedUser) {
        customerMock.done();
        expect(err).to.not.exist();
        expect(removedUser.npm_user).to.equal('boomer');
        expect(removedUser.deleted).to.be.a.string();
        done();
      });
    });

    it('is an alias for declineSponsorship', function(done) {
      var Customer = new CustomerAgent('bob');
      var customerMock = nock(LICENSE_API)
        .delete('/sponsorship/20/boomer')
        .reply(200, {
          "id": 10,
          "license_id": 20,
          "npm_user": "boomer",
          "verification_key": "e640f651-ef53-4560-86a6-34cae5a38e15",
          "verified": true,
          "created": "2015-07-29T14:13:04.826Z",
          "updated": "2015-07-29T14:13:16.206Z",
          "deleted": "2015-07-29T14:53:01.243Z"
        });

      Customer.declineSponsorship("boomer", 20, function(err, removedUser) {
        customerMock.done();
        expect(err).to.not.exist();
        expect(removedUser.npm_user).to.equal('boomer');
        expect(removedUser.deleted).to.be.a.string();
        done();
      });
    });

    it('is an alias for revokeSponsorship', function(done) {
      var Customer = new CustomerAgent('bob');
      var customerMock = nock(LICENSE_API)
        .delete('/sponsorship/20/boomer')
        .reply(200, {
          "id": 10,
          "license_id": 20,
          "npm_user": "boomer",
          "verification_key": "e640f651-ef53-4560-86a6-34cae5a38e15",
          "verified": true,
          "created": "2015-07-29T14:13:04.826Z",
          "updated": "2015-07-29T14:13:16.206Z",
          "deleted": "2015-07-29T14:53:01.243Z"
        });

      Customer.revokeSponsorship("boomer", 20, function(err, removedUser) {
        customerMock.done();
        expect(err).to.not.exist();
        expect(removedUser.npm_user).to.equal('boomer');
        expect(removedUser.deleted).to.be.a.string();
        done();
      });
    });
  });

  describe("cancelSubscription(subscriptionId)", function() {

    it("makes an external request for /customer/{user}/stripe/subscription/{subscriptionId}", function(done) {
      var Customer = new CustomerAgent('bill');

      var customerMock = nock(LICENSE_API)
        .delete('/customer/bill/stripe/subscription/sub_123456')
        .reply(200, {
          id: 'sub_12346',
          current_period_end: 1436995358,
          current_period_start: 1434403358,
          quantity: 2,
          status: 'active',
          interval: 'month',
          amount: 1200,
          license_id: 1,
          npm_org: 'bigco',
          npm_user: 'bob',
          product_id: '1031405a-70b7-4a3f-b552-8609d9e1428e'
        });

      Customer.cancelSubscription("sub_123456", function(err, body) {
        customerMock.done();
        expect(err).to.be.null();
        done();
      });
    });

    it("returns an error in the callback if sub doesn't exist", function(done) {
      var Customer = new CustomerAgent('bill');

      var customerMock = nock(LICENSE_API)
        .delete('/customer/bill/stripe/subscription/sub_2')
        .reply(404);

      Customer.cancelSubscription("sub_2", function(err, body) {
        customerMock.done();
        expect(err).to.exist();
        expect(err.message).to.equal("License not found");
        expect(err.statusCode).to.equal(404);
        done();
      });
    });

    it("returns the response body in the callback", function(done) {
      var Customer = new CustomerAgent('bill');

      var customerMock = nock(LICENSE_API)
        .delete('/customer/bill/stripe/subscription/sub_123456')
        .reply(200, {
          id: 'sub_12346',
          current_period_end: 1436995358,
          current_period_start: 1434403358,
          quantity: 2,
          status: 'active',
          interval: 'month',
          amount: 1200,
          license_id: 1,
          npm_org: 'bigco',
          npm_user: 'bob',
          product_id: '1031405a-70b7-4a3f-b552-8609d9e1428e'
        });

      Customer.cancelSubscription('sub_123456', function(err, body) {
        customerMock.done();
        expect(err).to.be.null();
        expect(body.npm_user).to.equal('bob');
        done();
      });
    });

  });
});
