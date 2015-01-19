var Code = require('code'),
    Lab = require('lab'),
    lab = exports.lab = Lab.script(),
    describe = lab.experiment,
    before = lab.before,
    after = lab.after,
    it = lab.test,
    expect = Code.expect;

var server;

// prepare the server
before(function (done) {
  require('../mocks/server')(function (obj) {
    server = obj;
    done();
  });
});

after(function (done) {
  server.stop(done);
});

describe('getting contact info', function () {
  it('can be reached via the /contact route', function (done) {
    server.inject('/contact', function (resp) {
      expect(resp.statusCode).to.equal(200);
      var source = resp.request.response.source;
      expect(source.template).to.equal('company/contact');
      done();
    });
  });

  it('can be reached via the /support route', function (done) {
    server.inject('/support', function (resp) {
      expect(resp.statusCode).to.equal(200);
      var source = resp.request.response.source;
      expect(source.template).to.equal('company/contact');
      done();
    });
  });
});

describe('sending a contact email', function () {
  it('fails if it is missing the cookie', function (done) {
    var opts = {
      url: '/send-contact',
      method: 'POST',
      payload: {
        name: 'Boom',
        email: 'boom@bam.com',
        subject: 'Hi!',
        inquire: 'support',
        message: 'This is a message.'
      }
    };

    server.inject(opts, function (resp) {
      expect(resp.statusCode).to.equal(403);
      expect(resp.result.error).to.equal('Forbidden');
      done();
    });
  });

  it('sends an email to support if it\'s a support inquiry', function (done) {
    server.inject({url: '/contact'}, function (resp) {
      var header = resp.headers['set-cookie'];
      expect(header.length).to.equal(1);

      var cookieCrumb = header[0].match(/crumb=([^\x00-\x20\"\,\;\\\x7F]*)/)[1];

      expect(resp.result).to.include('<input type="hidden" name="crumb" value="' + cookieCrumb + '"/>');

      var opts = {
        url: '/send-contact',
        method: 'POST',
        payload: {
          name: 'Boom',
          email: 'boom@bam.com',
          subject: 'Hi!',
          inquire: 'support',
          message: 'This is a message.',
          crumb: cookieCrumb
        },
        headers: { cookie: 'crumb=' + cookieCrumb }
      };

      server.inject(opts, function (resp) {
        expect(resp.statusCode).to.equal(200);
        var source = resp.request.response.source;
        expect(process.env.NODE_ENV).to.equal('dev');
        var mail = JSON.parse(source.context.mail);
        expect(mail.to).to.include('support@npmjs.com');
        expect(source.template).to.equal('company/contact');
        done();
      });
    });
  });

  it('sends an email to npm if it\'s a general inquiry', function (done) {

    server.inject({url: '/contact'}, function (resp) {
      var header = resp.headers['set-cookie'];
      expect(header.length).to.equal(1);

      var cookieCrumb = header[0].match(/crumb=([^\x00-\x20\"\,\;\\\x7F]*)/)[1];

      expect(resp.result).to.include('<input type="hidden" name="crumb" value="' + cookieCrumb + '"/>');

      var opts = {
        url: '/send-contact',
        method: 'POST',
        payload: {
          name: 'Boom',
          email: 'boom@bam.com',
          subject: 'Hi!',
          inquire: 'general',
          message: 'This is a message.',
          crumb: cookieCrumb
        },
        headers: { cookie: 'crumb=' + cookieCrumb }
      };

      server.inject(opts, function (resp) {
        expect(resp.statusCode).to.equal(200);
        var source = resp.request.response.source;
        expect(process.env.NODE_ENV).to.equal('dev');
        var mail = JSON.parse(source.context.mail);
        expect(mail.to).to.include('npm@npmjs.com');
        expect(source.template).to.equal('company/contact');
        done();
      });
    });
  });

  it('rejects submission if `honey` is in the payload', function (done) {

    server.inject({url: '/contact'}, function (resp) {
      var header = resp.headers['set-cookie'];
      expect(header.length).to.equal(1);

      var cookieCrumb = header[0].match(/crumb=([^\x00-\x20\"\,\;\\\x7F]*)/)[1];

      expect(resp.result).to.include('<input type="hidden" name="crumb" value="' + cookieCrumb + '"/>');

      var opts = {
        url: '/send-contact',
        method: 'POST',
        payload: {
          name: 'Boom',
          email: 'boom@bam.com',
          subject: 'Hi!',
          inquire: 'general',
          message: 'This is a message.',
          honey: 'I am a robot bear.',
          crumb: cookieCrumb
        },
        headers: { cookie: 'crumb=' + cookieCrumb }
      };

      server.inject(opts, function (resp) {
        expect(resp.statusCode).to.equal(400);
        expect(resp.result.error).to.exist();
        expect(resp.result.error).to.equal('Bad Request');
        done();
      });
    });
  });




});
