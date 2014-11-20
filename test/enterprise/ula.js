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

describe('Getting to the ULA page', function () {
  it('creates a new customer when one doesn\'t exist', function (done) {

    server.inject({url: '/enterprise'}, function (resp) {
      var header = resp.headers['set-cookie'];
      expect(header.length).to.equal(1);

      var cookieCrumb = header[0].match(/crumb=([^\x00-\x20\"\,\;\\\x7F]*)/)[1];

      expect(resp.result).to.include('<input type="hidden" name="crumb" value="' + cookieCrumb + '"/>');

      var opts = {
        method: 'post',
        url: '/enterprise-start-signup',
        payload: {
          firstname: 'Blerg',
          lastname: 'Bam',
          email: 'new@bam.com',
          phone: '123-456-7890',
          company: 'npm, Inc.',
          numemployees: '1-25',
          comments: 'teehee',
          crumb: cookieCrumb
        },
        headers: { cookie: 'crumb=' + cookieCrumb }
      };

      server.inject(opts, function (resp) {
        expect(resp.statusCode).to.equal(200);
        expect(source.template).to.equal('enterprise/clickThroughAgreement');
        expect(source.context.customer_id).to.equal('23456');
        expect(source.context.customer_email).to.equal('new@bam.com');
        done();
      });
    });
  });

  it('re-renders signup page with errors if form input contains non-whitelisted properties', function (done) {

    server.inject({url: '/enterprise'}, function (resp) {
      var header = resp.headers['set-cookie'];
      expect(header.length).to.equal(1);

      var cookieCrumb = header[0].match(/crumb=([^\x00-\x20\"\,\;\\\x7F]*)/)[1];

      expect(resp.result).to.include('<input type="hidden" name="crumb" value="' + cookieCrumb + '"/>');

      var opts = {
        method: 'post',
        url: '/enterprise-start-signup',
        payload: {
          firstname: 'Blerg',
          lastname: 'Bam',
          secrets: 'yes',
          malicious_intent: true,
          email: 'new@bam.com',
          phone: '123-456-7890',
          company: 'npm, Inc.',
          numemployees: '1-25',
          comments: 'teehee',
          crumb: cookieCrumb
        },
        headers: { cookie: 'crumb=' + cookieCrumb }
      };

      server.inject(opts, function (resp) {
        expect(resp.statusCode).to.equal(400);
        expect(source.template).to.equal('enterprise/index');
        expect(source.context.errors).to.exist;
        var names = source.context.errors.map(function(error){
          return error.path
        })
        expect(names).to.include('malicious_intent')
        expect(names).to.include('secrets')
        done();
      });
    });
  });


  it('re-renders signup page with errors if form input is invalid', function (done) {

    server.inject({url: '/enterprise'}, function (resp) {
      var header = resp.headers['set-cookie'];
      expect(header.length).to.equal(1);

      var cookieCrumb = header[0].match(/crumb=([^\x00-\x20\"\,\;\\\x7F]*)/)[1];

      expect(resp.result).to.include('<input type="hidden" name="crumb" value="' + cookieCrumb + '"/>');

      var opts = {
        method: 'post',
        url: '/enterprise-start-signup',
        payload: {
          firstname: 'Blerg',
          lastname: 'Bam',
          email: 'new-OOPS-bam.com',
          phone: '123-456-7890',
          company: "",
          numemployees: '1-25',
          comments: "",
          crumb: cookieCrumb
        },
        headers: { cookie: 'crumb=' + cookieCrumb }
      };

      server.inject(opts, function (resp) {
        expect(resp.statusCode).to.equal(400);
        expect(source.template).to.equal('enterprise/index');
        expect(source.context.errors).to.exist;
        var names = source.context.errors.map(function(error){
          return error.path
        })
        expect(names).to.not.include('comments') // because they're optional
        expect(names).to.include('company')
        expect(names).to.include('email')
        done();
      });
    });
  });

  it('gets the customer when they already exist', function (done) {

    server.inject({url: '/enterprise'}, function (resp) {
      var header = resp.headers['set-cookie'];
      expect(header.length).to.equal(1);

      var cookieCrumb = header[0].match(/crumb=([^\x00-\x20\"\,\;\\\x7F]*)/)[1];

      expect(resp.result).to.include('<input type="hidden" name="crumb" value="' + cookieCrumb + '"/>');

      var opts = {
        method: 'post',
        url: '/enterprise-start-signup',
        payload: {
          firstname: 'Boom',
          lastname: 'Bam',
          email: 'exists@bam.com',
          phone: '123-456-7890',
          company: 'npm, Inc.',
          numemployees: '1-25',
          comments: 'teehee',
          crumb: cookieCrumb
        },
        headers: { cookie: 'crumb=' + cookieCrumb }
      };

      server.inject(opts, function (resp) {
        expect(resp.statusCode).to.equal(200);
        expect(source.template).to.equal('enterprise/clickThroughAgreement');
        expect(source.context.customer_id).to.equal('12345');
        expect(source.context.customer_email).to.equal('exists@bam.com');
        done();
      });
    });
  });

  it('renders an error when hubspot errors out when getting a customer', function (done) {

    server.inject({url: '/enterprise'}, function (resp) {
      var header = resp.headers['set-cookie'];
      expect(header.length).to.equal(1);

      var cookieCrumb = header[0].match(/crumb=([^\x00-\x20\"\,\;\\\x7F]*)/)[1];

      expect(resp.result).to.include('<input type="hidden" name="crumb" value="' + cookieCrumb + '"/>');

      var opts = {
        method: 'post',
        url: '/enterprise-start-signup',
        payload: {
          firstname: 'Boom',
          lastname: 'Bam',
          email: 'error@bam.com',
          phone: '123-456-7890',
          company: 'npm, Inc.',
          numemployees: '1-25',
          comments: 'teehee',
          crumb: cookieCrumb
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
