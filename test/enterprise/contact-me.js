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

describe('Getting to the contact me page', function () {
  it('posts the data and goes straight to the template', function (done) {
    server.inject({url: '/enterprise'}, function (resp) {
      var header = resp.headers['set-cookie'];
      expect(header.length).to.equal(1);

      var cookieCrumb = header[0].match(/crumb=([^\x00-\x20\"\,\;\\\x7F]*)/)[1];

      expect(resp.result).to.include('<input type="hidden" name="crumb" value="' + cookieCrumb + '"/>');

      var opts = {
        method: 'post',
        url: '/enterprise-contact-me',
        payload: {
          crumb: cookieCrumb,
          contact_customer_email: 'boom@bam.com',
          contact_customer_id: '12345'
        },
        headers: { cookie: 'crumb=' + cookieCrumb }
      };

      server.inject(opts, function (resp) {
        expect(resp.statusCode).to.equal(200);
        expect(source.template).to.equal('enterprise/contact-me');
        done();
      });
    });
  });

  it('shows an error if something goes wrong with hubspot', function (done) {
    server.inject({url: '/enterprise'}, function (resp) {
      var header = resp.headers['set-cookie'];
      expect(header.length).to.equal(1);

      var cookieCrumb = header[0].match(/crumb=([^\x00-\x20\"\,\;\\\x7F]*)/)[1];

      expect(resp.result).to.include('<input type="hidden" name="crumb" value="' + cookieCrumb + '"/>');

      var opts = {
        method: 'post',
        url: '/enterprise-contact-me',
        payload: {
          crumb: cookieCrumb,
          contact_customer_email: 'error@bam.com',
          contact_customer_id: '12345'
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
