var Code = require('code'),
    Lab = require('lab'),
    lab = exports.lab = Lab.script(),
    describe = lab.experiment,
    beforeEach = lab.beforeEach,
    before = lab.before,
    after = lab.after,
    it = lab.test,
    expect = Code.expect,
    Hapi = require('hapi'),
    email = require('../../services/email'),
    config = require('../../config'),
    nodemailer = require('nodemailer'),
    metrics = require('../../adapters/metrics')(config.metrics),
    oldCreateTransport,
    server;

beforeEach(function (done) {
  server = new Hapi.Server();
  server.connection({ host: 'localhost' });
  server.register(email, function () {
    server.start(done);
  });
});

before(function (done) {
  oldCreateTransport = nodemailer.createTransport;

  nodemailer.createTransport = function () {
    return {
      sendMail: function (mail, cb) {
        if (mail === 'error') {
          return cb(new Error('ooh bad'));
        }

        return cb(null);
      }
    };
  };

  done();
});

after(function (done) {
  nodemailer.createTransport = oldCreateTransport;
  done();
});

describe('send an email', function () {
  it('has the proper environment variables', function (done) {
    expect(process.env.MAIL_ACCESS_KEY_ID).to.exist();
    expect(process.env.MAIL_SECRET_ACCESS_KEY).to.exist();
    done();
  });

  it('has no errors if sendMail has no errors', function (done) {

    var mail = {from: 'boom@npmjs.com', to: 'blah@npmjs.com'};

    server.methods.email.send(mail, function (er) {
      expect(er).to.be.null();
      done();
    });
  });

  it('has errors if sendMail has errors', function (done) {

    var mail = 'error';

    server.methods.email.send(mail, function (er) {
      expect(er).to.exist();
      expect(er.message).to.equal('ooh bad');
      done();
    });
  });
});