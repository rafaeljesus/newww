var Code = require('code'),
  Lab = require('lab'),
  lab = exports.lab = Lab.script(),
  describe = lab.experiment,
  before = lab.before,
  after = lab.after,
  it = lab.test,
  expect = Code.expect,
  nock = require("nock"),
  users = require('../../fixtures').users;

var MockTransport = require('nodemailer-mock-transport');
var sendEmail = require('../../../adapters/send-email');
var requireInject = require('require-inject');
var redisMock = require('redis-mock');
var client = redisMock.createClient();

var server;
var emailMock;

before(function(done) {
  requireInject.installGlobally('../../mocks/server', {
    redis: redisMock
  })(function(obj) {
    server = obj;
    sendEmail.mailConfig.mailTransportModule = new MockTransport();
    emailMock = sendEmail.mailConfig.mailTransportModule;
    done();
  });
});

after(function(done) {
  server.stop(done);
});

function assertEmail() {
  var expectedName = 'bob';
  var expectedEmail = 'bob@boom.me';
  var expectedTo = '"' + expectedName + '" <' + expectedEmail + '>';
  var expectedFrom = '"npm, Inc." <website@npmjs.com>';
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
  expect(msg.data.name).to.equal(expectedName);
  expect(msg.data.support_email).to.equal(expectedSupportEmail);
  expect(msg.message.content).to.match(new RegExp(expectedName));
  expect(msg.message.content).to.match(new RegExp(expectedSupportEmail));
}

describe('Request to resend confirmation email', function() {

  it('redirects to login if user is not already logged in', function(done) {
    var opts = {
      url: '/resend-email-confirmation'
    };

    server.inject(opts, function(resp) {
      expect(resp.statusCode).to.equal(302);
      expect(resp.headers.location).to.equal('/login');
      done();
    });
  });

  it('sends an email & takes the user to the /profile-edit page without any errors', function(done) {
    var userMock = nock("https://user-api-example.com")
      .get("/user/bob")
      .reply(200, users.bob);

    var licenseMock = nock("https://license-api-example.com")
      .get("/customer/bob/stripe")
      .reply(404);

    var opts = {
      url: '/resend-email-confirmation',
      credentials: users.bob
    };

    server.inject(opts, function(resp) {
      userMock.done();
      licenseMock.done();
      expect(resp.statusCode).to.equal(302);
      expect(resp.headers.location).to.equal('/profile-edit?verification-email-sent=true');
      assertEmail();
      done();
    });
  });

  it('renders an error if we were unable to send the email', function(done) {
    var userMock = nock("https://user-api-example.com")
      .get("/user/" + users.bad_email.name)
      .reply(200, users.bad_email);

    var licenseMock = nock("https://license-api-example.com")
      .get("/customer/" + users.bad_email.name + "/stripe")
      .reply(404);

    var opts = {
      url: '/resend-email-confirmation',
      credentials: users.bad_email
    };

    server.inject(opts, function(resp) {
      userMock.done();
      licenseMock.done();
      expect(resp.statusCode).to.equal(500);
      var source = resp.request.response.source;
      expect(source.template).to.equal('errors/internal');
      done();
    });
  });
});
