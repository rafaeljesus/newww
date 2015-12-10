var Code = require('code'),
  Lab = require('lab'),
  lab = exports.lab = Lab.script(),
  describe = lab.experiment,
  beforeEach = lab.beforeEach,
  afterEach = lab.afterEach,
  before = lab.before,
  after = lab.after,
  it = lab.test,
  expect = Code.expect,
  Hapi = require('hapi'),
  email = require('../../services/email'),
  server,
  MockTransport = require('nodemailer-mock-transport'),
  mock = new MockTransport({
    boom: 'bam'
  }),
  redis = require('redis-mock'),
  redisClient;

beforeEach(function(done) {
  server = new Hapi.Server();
  server.connection({
    host: 'localhost'
  });
  server.register(email, function() {
    var mailConfig = require('../../services/email/methods/send').mailConfig;
    mailConfig.mailTransportModule = mock;
    server.start(done);
  });
});

before(function(done) {
  redisClient = redis.createClient();
  redisClient.on("error", function(err) {
    console.log("Error " + err);
  });

  done();
});

afterEach(function(done) {
  mock.sentMail.pop();
  done();
});

after(function(done) {
  redisClient.flushdb();
  server.stop(function() {
    done();
  });
});

describe('send an email', function() {

  it('throws if redis is not included', function(done) {
    expect(function() {
      server.methods.email.send('something', {});
    }).to.throw('we require a redis instance');
    done();
  });

  it('has no errors if sendMail has no errors', function(done) {
    var user = {
      email: 'user@npmjs.com',
      name: 'user'
    };

    server.methods.email.send('confirm-user-email', user, redisClient)
      .then(function() {
        var msg = mock.sentMail[0];
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

    server.methods.email.send('something', mail, redisClient)
      .then(function() {
        var msg = mock.sentMail[0];
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
