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
        var source = resp.request.response.source;
        expect(source.template).to.equal('enterprise/contact-me');
        done();
      });
    });
  });

  it('rejects invalid email address', function (done) {
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
            contact_customer_email: 'boomATbam.com-pletely-not-an-email-address',
            contact_customer_id: '12345'
          },
          headers: { cookie: 'crumb=' + cookieCrumb }
        };

        server.inject(opts, function (resp) {
          expect(resp.statusCode).to.equal(400);
          var source = resp.request.response.source;
          expect(source.template).to.equal('enterprise/index');
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
        var source = resp.request.response.source;
        expect(source.template).to.equal('errors/internal');
        expect(source.context.correlationID).to.exist();
        expect(resp.payload).to.include(source.context.correlationID);
        done();
      });
    });
  });
});
