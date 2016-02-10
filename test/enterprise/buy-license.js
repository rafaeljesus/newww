var LICENSE_API = 'https://license-api-example.com';

var generateCrumb = require("../handlers/crumb.js"),
  Code = require('code'),
  Lab = require('lab'),
  lab = exports.lab = Lab.script(),
  describe = lab.experiment,
  before = lab.before,
  afterEach = lab.afterEach,
  after = lab.after,
  it = lab.test,
  expect = Code.expect,
  nock = require('nock'),
  moment = require('moment'),
  MockTransport = require('nodemailer-mock-transport'),
  sendEmail = require('../../adapters/send-email'),
  fixtures = require('../fixtures'),
  emailMock,
  server;

var requireInject = require('require-inject');
var redisMock = require('redis-mock');
var client = redisMock.createClient();

before(function(done) {
  requireInject.installGlobally('../mocks/server', {
    redis: redisMock
  })(function(obj) {
    server = obj;
    sendEmail.mailConfig.mailTransportModule = new MockTransport();
    emailMock = sendEmail.mailConfig.mailTransportModule;
    done();
  });
});

afterEach(function(done) {
  emailMock.sentMail = [];
  done();
});

after(function(done) {
  server.stop(done);
});

function assertEmail() {
  var expectedName = 'Boom Bam';
  var expectedEmail = 'exists@bam.com';
  var expectedTo = '"' + expectedName + '" <' + expectedEmail + '>';
  var expectedFrom = '"npm, Inc." <website@npmjs.com>';
  var expectedLicenseKey = '0feed16c-0f28-4911-90f4-dfe49f7bfb41';
  var expectedSupportEmail = 'support@npmjs.com';
  var expectedRequirementsUrl = 'https://docs.npmjs.com/enterprise/requirements';
  var expectedInstructionsUrl = 'https://docs.npmjs.com/enterprise/installation';

  var msg = emailMock.sentMail[0];
  expect(msg.data.to).to.equal(expectedTo);
  expect(msg.message._headers.find(function(header) {
    return header.key === 'To';
  }).value).to.equal(expectedTo);
  expect(msg.data.from).to.equal(expectedFrom);
  expect(msg.message._headers.find(function(header) {
    return header.key === 'From';
  }).value).to.equal(expectedFrom);
  expect(msg.data.license_key).to.equal(expectedLicenseKey);
  expect(msg.data.support_email).to.equal(expectedSupportEmail);
  expect(msg.data.requirementsUrl).to.equal(expectedRequirementsUrl);
  expect(msg.data.instructionsUrl).to.equal(expectedInstructionsUrl);
  expect(msg.message.content).to.match(new RegExp(expectedName));
  expect(msg.message.content).to.match(new RegExp(expectedEmail));
  expect(msg.message.content).to.match(new RegExp(expectedLicenseKey));
  expect(msg.message.content).to.match(new RegExp(expectedSupportEmail));
  expect(msg.message.content).to.match(new RegExp(expectedRequirementsUrl));
  expect(msg.message.content).to.match(new RegExp(expectedInstructionsUrl));
}

describe('Posting to the enterprise license purchase page', function() {
  it('errors out if the email sent is invalid', function(done) {
    generateCrumb(server, function(crumb) {
      var p = Object.assign({}, fixtures.enterprise.buyLicensePayload, {
        email: 'invalid',
        crumb: crumb
      });

      var opts = {
        url: '/enterprise/buy-license',
        method: 'post',
        payload: p,
        headers: {
          cookie: 'crumb=' + crumb
        }
      };

      server.inject(opts, function(resp) {
        try {
          expect(resp.statusCode).to.equal(403);
          var source = resp.request.response.source;
          expect(source).to.equal('validation error');
          done();
        } catch (e) {
          done(e);
        }
      });
    });
  });

  it('renders an error if we get an error from the license API', function(done) {
    generateCrumb(server, function(crumb) {

      var customerMock = nock(LICENSE_API)
        .get('/customer/error@boom.com')
        .reply(500, 'something went wrong');

      var p = Object.assign({}, fixtures.enterprise.buyLicensePayload, {
        email: 'error@boom.com',
        crumb: crumb
      });

      var opts = {
        url: '/enterprise/buy-license',
        method: 'post',
        payload: p,
        headers: {
          cookie: 'crumb=' + crumb
        }
      };

      server.inject(opts, function(resp) {
        try {
          customerMock.done();
          expect(resp.statusCode).to.equal(500);
          var source = resp.request.response.source;
          expect(source).to.equal('error loading customer');
          done();
        } catch (e) {
          done(e);
        }
      });
    });
  });

  it('renders an error if the customer is not found', function(done) {
    generateCrumb(server, function(crumb) {

      var customerMock = nock(LICENSE_API)
        .get('/customer/new@boom.com')
        .reply(404, 'customer not found');

      var p = Object.assign({}, fixtures.enterprise.buyLicensePayload, {
        email: 'new@boom.com',
        crumb: crumb
      });

      var opts = {
        url: '/enterprise/buy-license',
        method: 'post',
        payload: p,
        headers: {
          cookie: 'crumb=' + crumb
        }
      };

      server.inject(opts, function(resp) {
        try {
          customerMock.done();
          expect(resp.statusCode).to.equal(404);
          var source = resp.request.response.source;
          expect(source).to.equal('customer not found');
          done();
        } catch (e) {
          done(e);
        }
      });
    });
  });

  it('renders an error if the customerID does not match the token customerID', function(done) {
    generateCrumb(server, function(crumb) {

      var customerMock = nock(LICENSE_API)
        .get('/customer/exists@boom.com')
        .reply(200, fixtures.enterprise.existingUser);

      var p = Object.assign({}, fixtures.enterprise.buyLicensePayload, {
        customerId: '123',
        crumb: crumb
      });

      var opts = {
        url: '/enterprise/buy-license',
        method: 'post',
        payload: p,
        headers: {
          cookie: 'crumb=' + crumb
        }
      };

      server.inject(opts, function(resp) {
        try {
          customerMock.done();
          expect(resp.statusCode).to.equal(500);
          var source = resp.request.response.source;
          expect(source).to.equal('error validating customer ID');
          done();
        } catch (e) {
          done(e);
        }
      });
    });
  });

  describe('for a multi-seat license', function() {
    it('sends an email on success', function(done) {

      process.env.NPME_PRODUCT_ID = '12345-12345-12345';

      var customerMock = nock(LICENSE_API)
        .get('/customer/exists@boom.com').twice()
        .reply(200, fixtures.enterprise.existingUser)
        .put('/license', {
          "product_id": "12345-12345-12345",
          "customer_id": 12345,
          "stripe_subscription_id": "1234567890",
          "seats": 20,
          begins: moment(Date.now()).format(), // starts now
          ends: moment(Date.now()).add(1, 'years').format(), // ends a year from now (webhooks will refresh)
        })
        .reply(200, fixtures.enterprise.goodLicense.licenses[0])
        .post('/customer/12345', {
          "stripe_customer_id": "cus_123abc"
        })
        .reply(200, {
          "stripe_customer_id": "cus_123abc"
        });

      var mock = nock('https://api.stripe.com')
        .post('/v1/customers')
        .query({
          card: 'tok_12345',
          plan: 'enterprise-multi-seat',
          quantity: 20,
          email: 'exists@boom.com',
          description: 'exists@boom.com npm On-Site multi-seat license'
        })
        .reply(200, fixtures.enterprise.stripeCustomer);


      generateCrumb(server, function(crumb) {
        var p = Object.assign({}, fixtures.enterprise.buyLicensePayload, {
          subType: 3,
          quantity: 20,
          crumb: crumb
        });

        var opts = {
          url: '/enterprise/buy-license',
          method: 'post',
          payload: p,
          headers: {
            cookie: 'crumb=' + crumb
          }
        };

        server.inject(opts, function(resp) {
          try {
            customerMock.done();
            mock.done();
            expect(resp.statusCode).to.equal(200);
            var source = resp.request.response.source;
            expect(source).to.equal('License purchase successful');
            delete process.env.NPME_PRODUCT_ID;
            assertEmail();
            done();
          } catch (e) {
            done(e);
          }
        });
      });
    });
  });

});
