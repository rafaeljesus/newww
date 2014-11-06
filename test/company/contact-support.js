var Lab = require('lab'),
    lab = exports.lab = Lab.script(),
    describe = lab.experiment,
    before = lab.before,
    after = lab.after,
    it = lab.test,
    expect = Lab.expect;

var server, serverResponse, source;

before(function (done) {
  server = require('../fixtures/setupServer')(done);

  server.ext('onPreResponse', function (request, next) {
    source = request.response.source;
    next();
  });
});

describe('getting contact info', function () {
  it('can be reached via the /contact route', function (done) {
    var opts = {
      url: '/contact'
    };

    server.inject(opts, function (resp) {
      expect(resp.statusCode).to.equal(200);
      expect(source.template).to.equal('company/contact');
      done();
    });
  });

  it('can be reached via the /support route', function (done) {
    var opts = {
      url: '/support'
    };

    server.inject(opts, function (resp) {
      expect(resp.statusCode).to.equal(200);
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
    }

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
      }

      server.inject(opts, function (resp) {
        expect(resp.statusCode).to.equal(200);
        expect(source).to.be.an('object');
        expect(source.to).to.include('support@npmjs.com')
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
      }

      server.inject(opts, function (resp) {
        expect(resp.statusCode).to.equal(200);
        expect(source).to.be.an('object');
        expect(source.to).to.include('npm@npmjs.com')
        done();
      });
    });
  });
});