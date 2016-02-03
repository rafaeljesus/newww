var generateCrumb = require("../handlers/crumb.js"),
  Code = require('code'),
  Lab = require('lab'),
  lab = exports.lab = Lab.script(),
  describe = lab.experiment,
  before = lab.before,
  after = lab.after,
  it = lab.test,
  expect = Code.expect,
  nock = require('nock'),
  fixtures = require('../fixtures');

var server;


before(function(done) {
  require('../mocks/server')(function(obj) {
    server = obj;
    done();
  });
});

after(function(done) {
  server.stop(done);
});

describe('Getting to the ULA page', function() {
  it('creates a new customer when one doesn\'t exist', function(done) {

    var LICENSE_API = "https://license-api-example.com";
    var hubspotMock = nock(LICENSE_API)
      .put('/customer', {
        "email": "new@bam.com",
        "name": "Blerg Bam",
        "phone": "123-456-7890"
      })
      .reply(200, fixtures.enterprise.newUser);

    generateCrumb(server, function(crumb) {
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
          crumb: crumb
        },
        headers: {
          cookie: 'crumb=' + crumb
        }
      };

      server.inject(opts, function(resp) {
        hubspotMock.done();
        expect(resp.statusCode).to.equal(200);
        var source = resp.request.response.source;
        expect(source.template).to.equal('enterprise/clickThroughAgreement');
        expect(source.context.customer_id).to.equal(23456);
        expect(source.context.customer_email).to.equal('new@bam.com');
        done();
      });
    });
  });

  it('re-renders signup page with errors if form input contains non-whitelisted properties', function(done) {

    generateCrumb(server, function(crumb) {
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
          crumb: crumb
        },
        headers: {
          cookie: 'crumb=' + crumb
        }
      };

      server.inject(opts, function(resp) {
        expect(resp.statusCode).to.equal(400);
        var source = resp.request.response.source;
        expect(source.template).to.equal('enterprise/index');
        expect(source.context.errors).to.exist();
        var names = source.context.errors.map(function(error) {
          return error.path;
        });
        expect(names).to.include('malicious_intent');
        expect(names).to.include('secrets');
        done();
      });
    });
  });


  it('re-renders signup page with errors if form input is invalid', function(done) {

    generateCrumb(server, function(crumb) {
      var opts = {
        method: 'post',
        url: '/enterprise-start-signup',
        payload: {
          firstname: 'Blerg',
          lastname: 'Bam',
          email: 'new-OOPS-bam.com',
          phone: 'gfjbjhnb',
          company: "",
          numemployees: '1-25',
          comments: "",
          crumb: crumb
        },
        headers: {
          cookie: 'crumb=' + crumb
        }
      };

      server.inject(opts, function(resp) {
        expect(resp.statusCode).to.equal(400);
        var source = resp.request.response.source;
        expect(source.template).to.equal('enterprise/index');
        expect(source.context.errors).to.exist();
        var errorMessages = source.context.errors.map(function(error) {
          return error.message;
        });
        var errorNames = source.context.errors.map(function(error) {
          return error.path;
        });
        expect(errorNames).to.include('phone');
        expect(errorMessages).to.include('phone is not valid');
        expect(errorNames).to.not.include('comments'); // because they're optional
        expect(errorNames).to.include('company');
        expect(errorNames).to.include('email');
        done();
      });
    });
  });

  it('gets the customer when they already exist', function(done) {

    generateCrumb(server, function(crumb) {
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
          crumb: crumb
        },
        headers: {
          cookie: 'crumb=' + crumb
        }
      };

      server.inject(opts, function(resp) {
        expect(resp.statusCode).to.equal(200);
        var source = resp.request.response.source;
        expect(source.template).to.equal('enterprise/clickThroughAgreement');
        expect(source.context.customer_id).to.equal(12345);
        expect(source.context.customer_email).to.equal('exists@bam.com');
        done();
      });
    });
  });

  it('renders an error when hubspot errors out when getting a customer', function(done) {

    generateCrumb(server, function(crumb) {
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
          crumb: crumb
        },
        headers: {
          cookie: 'crumb=' + crumb
        }
      };

      server.inject(opts, function(resp) {
        expect(resp.statusCode).to.equal(500);
        var source = resp.request.response.source;
        expect(source.template).to.equal('errors/internal');
        done();
      });
    });
  });
});
