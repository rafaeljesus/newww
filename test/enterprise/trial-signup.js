var Lab = require('lab'),
    lab = exports.lab = Lab.script(),
    describe = lab.experiment,
    before = lab.before,
    after = lab.after,
    it = lab.test,
    expect = Lab.expect;

var server, serverResponse, source, ctx;

before(function (done) {
  server = require('../fixtures/setupServer')(done);

  server.ext('onPreResponse', function (request, next) {
    source = request.response.source;
    next();
  });
});

describe('Getting to the thank-you page', function () {
  it('creates a new trial when a customer does not have one yet', function (done) {

    server.inject({url: '/enterprise'}, function (resp) {
      var header = resp.headers['set-cookie'];
      expect(header.length).to.equal(1);

      var cookieCrumb = header[0].match(/crumb=([^\x00-\x20\"\,\;\\\x7F]*)/)[1];

      expect(resp.result).to.include('<input type="hidden" name="crumb" value="' + cookieCrumb + '"/>');

      var opts = {
        method: 'post',
        url: '/enterprise-trial-signup',
        payload: {
          crumb: cookieCrumb,
          customer_email: 'exists@bam.com',
          customer_id: '12345',
          agree: true
        },
        headers: { cookie: 'crumb=' + cookieCrumb }
      };

      server.inject(opts, function (resp) {
        expect(resp.statusCode).to.equal(200);
        expect(source.context.mail).to.exist;
        var mail = JSON.parse(source.context.mail);
        expect(mail.to).to.include('exists@bam.com')
        done();
      });
    });
  });

  it('returns an error if the customer does not exist yet', function (done) {
    server.inject({url: '/enterprise'}, function (resp) {
      var header = resp.headers['set-cookie'];
      expect(header.length).to.equal(1);

      var cookieCrumb = header[0].match(/crumb=([^\x00-\x20\"\,\;\\\x7F]*)/)[1];

      expect(resp.result).to.include('<input type="hidden" name="crumb" value="' + cookieCrumb + '"/>');

      var opts = {
        method: 'post',
        url: '/enterprise-trial-signup',
        payload: {
          crumb: cookieCrumb,
          customer_email: 'new@bam.com',
          customer_id: '12345',
          agree: true
        },
        headers: { cookie: 'crumb=' + cookieCrumb }
      };

      server.inject(opts, function (resp) {
        expect(resp.statusCode).to.equal(500);
        expect(source.template).to.equal('errors/internal');
        done();
      });
    });
  });

  it('returns an error if the given customer id does not match the stored customer id', function (done) {
    server.inject({url: '/enterprise'}, function (resp) {
      var header = resp.headers['set-cookie'];
      expect(header.length).to.equal(1);

      var cookieCrumb = header[0].match(/crumb=([^\x00-\x20\"\,\;\\\x7F]*)/)[1];

      expect(resp.result).to.include('<input type="hidden" name="crumb" value="' + cookieCrumb + '"/>');

      var opts = {
        method: 'post',
        url: '/enterprise-trial-signup',
        payload: {
          crumb: cookieCrumb,
          customer_email: 'new@bam.com',
          customer_id: '67890',
          agree: true
        },
        headers: { cookie: 'crumb=' + cookieCrumb }
      };

      server.inject(opts, function (resp) {
        expect(resp.statusCode).to.equal(500);
        expect(source.template).to.equal('errors/internal');
        done();
      });
    });
  });
});
