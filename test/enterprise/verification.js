var Code = require('code'),
  Lab = require('lab'),
  lab = exports.lab = Lab.script(),
  describe = lab.experiment,
  before = lab.before,
  afterEach = lab.afterEach,
  after = lab.after,
  it = lab.test,
  expect = Code.expect;

var server;
var emailMock;
var MockTransport = require('nodemailer-mock-transport');
var sendEmail = require('../../adapters/send-email');
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
  }, require('../../lib/error-handler'));
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
  expect(msg.message.content).to.match(new RegExp(expectedName));
  expect(msg.message.content).to.match(new RegExp(expectedEmail));
  expect(msg.message.content).to.match(new RegExp(expectedLicenseKey));
  expect(msg.message.content).to.match(new RegExp(expectedSupportEmail));
}

describe('finishing the enterprise signup process', function() {
  it('takes us to the enterprise/complete page if everything goes perfectly', function(done) {

    var opts = {
      url: '/enterprise-verify?v=12345'
    };

    server.inject(opts, function(resp) {
      expect(resp.statusCode).to.equal(200);
      var source = resp.request.response.source;
      expect(source.template).to.equal('enterprise/complete');
      expect(source.context.email).to.equal('exists@bam.com');
      assertEmail();
      done();
    });
  });

  it('takes us to a 404 page if the url does not include the verification key', function(done) {

    var opts = {
      url: '/enterprise-verify'
    };

    server.inject(opts, function(resp) {
      expect(resp.statusCode).to.equal(404);
      var source = resp.request.response.source;
      expect(source.template).to.equal('errors/not-found');
      done();
    });
  });

  it('errors out if the trial cannot be verified', function(done) {

    var opts = {
      url: '/enterprise-verify?v=error'
    };

    server.inject(opts, function(resp) {
      expect(resp.statusCode).to.equal(500);
      var source = resp.request.response.source;
      expect(source.template).to.equal('errors/internal');
      done();
    });
  });

  it('errors out if the customer could not be found', function(done) {

    var opts = {
      url: '/enterprise-verify?v=23456'
    };

    server.inject(opts, function(resp) {
      expect(resp.statusCode).to.equal(500);
      var source = resp.request.response.source;
      expect(source.template).to.equal('errors/internal');
      done();
    });
  });

  it('errors out if the license server returns an error', function(done) {

    var opts = {
      url: '/enterprise-verify?v=licenseBroken'
    };

    server.inject(opts, function(resp) {
      expect(resp.statusCode).to.equal(500);
      var source = resp.request.response.source;
      expect(source.template).to.equal('errors/internal');
      done();
    });
  });

  it('errors out if the licenses could not be found', function(done) {

    var opts = {
      url: '/enterprise-verify?v=noLicense'
    };

    server.inject(opts, function(resp) {
      expect(resp.statusCode).to.equal(400);
      var source = resp.request.response.source;
      expect(source.template).to.equal('errors/internal');
      done();
    });
  });

  it('errors out if too many licenses are found', function(done) {

    var opts = {
      url: '/enterprise-verify?v=tooManyLicenses'
    };

    server.inject(opts, function(resp) {
      expect(resp.statusCode).to.equal(400);
      var source = resp.request.response.source;
      expect(source.template).to.equal('errors/internal');
      done();
    });
  });
});
