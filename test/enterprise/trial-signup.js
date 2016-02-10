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
  fixtures = require('../fixtures');

var MockTransport = require('nodemailer-mock-transport');
var sendEmail = require('../../adapters/send-email');

var requireInject = require('require-inject');
var redisMock = require('redis-mock');
var client = redisMock.createClient();

var server;
var emailMock;

before(function(done) {
  process.env.NPME_PRODUCT_ID = '12345-12345-12345';
  process.env.HUBSPOT_PORTAL_ID = '12345';
  process.env.HUBSPOT_FORM_NPME_AGREED_ULA = '67890';

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
  delete process.env.NPME_PRODUCT_ID;
  delete process.env.HUBSPOT_PORTAL_ID;
  delete process.env.HUBSPOT_FORM_NPME_AGREED_ULA;
  server.stop(done);
});

function assertEmail() {
  var expectedName = 'Boom Bam';
  var expectedEmail = 'exists@bam.com';
  var expectedTo = '"' + expectedName + '" <' + expectedEmail + '>';
  var expectedFrom = '"npm, Inc." <website@npmjs.com>';
  var expectedVerificationKey = '12ab34cd-a123-4b56-789c-1de2deadbeef';
  var expectedSupportEmail = 'support@npmjs.com';

  var msg = emailMock.sentMail[0];
  expect(msg.data.to).to.equal(expectedTo);
  expect(msg.message._headers.find(function(header) {
    return header.key === 'To';
  }).value).to.equal(expectedTo);
  expect(msg.data.from).to.equal(expectedFrom);
  expect(msg.message._headers.find(function(header) {
    return header.key === 'From';
  }).value).to.equal(expectedFrom);
  expect(msg.data.support_email).to.equal(expectedSupportEmail);
  expect(msg.message.content).to.match(new RegExp(expectedSupportEmail));
  expect(msg.data.verification_key).to.equal(expectedVerificationKey);
  expect(msg.message.content).to.match(new RegExp(expectedVerificationKey));
  expect(msg.message.content).to.match(new RegExp(expectedName));
}

describe('Getting to the thank-you page', function() {
  it('creates a new trial when a customer does not have one yet', function(done) {

    generateCrumb(server, function(crumb) {
      var customerMock = nock(LICENSE_API)
        .get('/customer/exists@bam.com')
        .reply(200, fixtures.enterprise.existingUser)
        .get('/trial/' + process.env.NPME_PRODUCT_ID + '/exists@bam.com')
        .reply(200, fixtures.enterprise.existingUser);

      var hubspotMock = nock('https://forms.hubspot.com')
        .post('/uploads/form/v2/12345/67890')
        .reply(204);

      var opts = {
        method: 'post',
        url: '/enterprise-trial-signup',
        payload: {
          crumb: crumb,
          customer_email: 'exists@bam.com',
          customer_id: '12345',
          agree: true
        },
        headers: {
          cookie: 'crumb=' + crumb
        }
      };

      server.inject(opts, function(resp) {
        customerMock.done();
        hubspotMock.done();
        var source = resp.request.response.source;
        expect(resp.statusCode).to.equal(200);
        expect(source.template).to.equal('enterprise/thanks');
        assertEmail();
        done();
      });
    });
  });

  it('returns an error if the customer does not exist yet', function(done) {

    generateCrumb(server, function(crumb) {
      var customerMock = nock(LICENSE_API)
        .get('/customer/new@bam.com')
        .reply(404, 'user not found');

      var hubspotMock = nock('https://forms.hubspot.com')
        .post('/uploads/form/v2/12345/67890')
        .reply(204);

      var opts = {
        method: 'post',
        url: '/enterprise-trial-signup',
        payload: {
          crumb: crumb,
          customer_email: 'new@bam.com',
          customer_id: '12345',
          agree: true
        },
        headers: {
          cookie: 'crumb=' + crumb
        }
      };

      server.inject(opts, function(resp) {
        customerMock.done();
        hubspotMock.done();
        expect(resp.statusCode).to.equal(500);
        expect(resp.request.response.source.context.isBoom).to.be.true();
        done();
      });
    });
  });

  it('returns an error if the given customer id does not match the stored customer id', function(done) {

    generateCrumb(server, function(crumb) {
      var customerMock = nock(LICENSE_API)
        .get('/customer/new@bam.com')
        .reply(200, fixtures.enterprise.newLicense[0]);

      var hubspotMock = nock('https://forms.hubspot.com')
        .post('/uploads/form/v2/12345/67890')
        .reply(204);

      var opts = {
        method: 'post',
        url: '/enterprise-trial-signup',
        payload: {
          crumb: crumb,
          customer_email: 'new@bam.com',
          customer_id: '67890',
          agree: true
        },
        headers: {
          cookie: 'crumb=' + crumb
        }
      };

      server.inject(opts, function(resp) {
        customerMock.done();
        hubspotMock.done();
        expect(resp.statusCode).to.equal(500);
        expect(resp.request.response.source.context.isBoom).to.be.true();
        done();
      });
    });
  });
});
