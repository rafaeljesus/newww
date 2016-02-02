var Code = require('code'),
  Lab = require('lab'),
  lab = exports.lab = Lab.script(),
  describe = lab.experiment,
  afterEach = lab.afterEach,
  before = lab.before,
  after = lab.after,
  it = lab.test,
  expect = Code.expect;

var MockTransport = require('nodemailer-mock-transport');
var sendEmail = require('../../adapters/send-email');
var requireInject = require('require-inject');
var redisMock = require('redis-mock');
var client = redisMock.createClient();

var server;
var emailMock;

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
  emailMock.sentMail.pop();
  done();
});

after(function(done) {
  client.flushdb();
  server.stop(function() {
    // redisProcess.kill('SIGKILL');
    done();
  });
});

describe('send an email', function() {

  it('throws if redis is not included', function(done) {
    expect(function() {
      sendEmail('something', {});
    }).to.throw('we require a redis instance');
    done();
  });

  it('has no errors if sendMail has no errors', function(done) {
    var user = {
      email: 'user@npmjs.com',
      name: 'user'
    };

    sendEmail('confirm-user-email', user, client)
      .then(function() {
        var msg = emailMock.sentMail[0];
        expect(msg.data.to).to.equal('"user" <user@npmjs.com>');
        expect(msg.data.support_email).to.equal('support@npmjs.com');
        done();
      })
      .catch(function(err) {
        console.log(err)
        expect(err).to.not.exist();
        done();
      });
  });

  it('has errors if sendMail has errors', function(done) {

    var mail = 'error';

    sendEmail('something', mail, client)
      .then(function() {
        var msg = emailMock.sentMail[0];
        expect(msg).to.not.exist();
        done();
      })
      .catch(function(err) {
        expect(err).to.exist();
        expect(err.message).to.equal('I need to know who this email is being sent to :-(');
        done();
      });
  });
});
