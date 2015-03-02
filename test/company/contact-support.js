var Code = require('code'),
    Lab = require('lab'),
    lab = exports.lab = Lab.script(),
    describe = lab.experiment,
    before = lab.before,
    after = lab.after,
    it = lab.test,
    expect = Code.expect;

var generateCrumb = require("../handlers/crumb.js");

var server;

// prepare the server
before(function (done) {
  require('../mocks/server')(function (obj) {
    server = obj;
    server.app.cache._cache.connection.client = {};
    done();
  });
});

after(function (done) {
  delete server.app.cache._cache.connection.client;
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

    generateCrumb(server, function(crumb) {
      var opts = {
        url: '/send-contact',
        method: 'POST',
        payload: {
          name: 'Boom',
          email: 'boom@bam.com',
          subject: 'Hi!',
          inquire: 'support',
          message: 'This is a message.',
          crumb: crumb
        },
        headers: { cookie: 'crumb=' + crumb }
      };

      server.inject(opts, function (resp) {
        expect(resp.statusCode).to.equal(200);
        var source = resp.request.response.source;
        expect(source.template).to.equal('company/contact');
        done();
      });
    });
  });

  it('sends an email to npm if it\'s a general inquiry', function (done) {

    generateCrumb(server, function(crumb) {
      var opts = {
        url: '/send-contact',
        method: 'POST',
        payload: {
          name: 'Boom',
          email: 'boom@bam.com',
          subject: 'Hi!',
          inquire: 'general',
          message: 'This is a message.',
          crumb: crumb
        },
        headers: { cookie: 'crumb=' + crumb }
      };

      server.inject(opts, function (resp) {
        expect(resp.statusCode).to.equal(200);
        var source = resp.request.response.source;
        expect(source.template).to.equal('company/contact');
        done();
      });
    });
  });

  it('rejects submission if `honey` is in the payload', function (done) {

    generateCrumb(server, function(crumb) {

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
          crumb: crumb
        },
        headers: { cookie: 'crumb=' + crumb }
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
