var generateCrumb = require("../handlers/crumb.js"),
    Code = require('code'),
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
    server.app.cache._cache.connection.client = {};
    done();
  });
});

after(function (done) {
  server.stop(done);
});

describe('Getting to the enterprise license purchase page', function () {
  it('gets there, no problem', function (done) {
    var opts = {
      url: '/enterprise/license'
    };

    server.inject(opts, function (resp) {
      expect(resp.statusCode).to.equal(200);
      var source = resp.request.response.source;
      expect(source.template).to.equal('enterprise/find-license');
      expect(source.context.title).to.equal('npm Enterprise');
      done();
    });
  });
});

describe('Posting to the enterprise license purchase page', function () {
  it('errors out if the email sent is invalid', function (done) {
    generateCrumb(server, function (crumb) {
      var opts = {
        url: '/enterprise/license',
        method: 'post',
        payload: {
          email: 'bademail',
          crumb: crumb
        },
        headers: { cookie: 'crumb=' + crumb }
      };

      server.inject(opts, function (resp) {
        expect(resp.statusCode).to.equal(400);
        var source = resp.request.response.source;
        expect(source.template).to.equal('enterprise/invalid-license');
        expect(source.context.msg).to.equal('The email or license key you entered appear to be invalid.');
        done();
      });
    });
  });

  it('errors out if the license key sent is invalid', function (done) {
    generateCrumb(server, function (crumb) {
      var opts = {
        url: '/enterprise/license',
        method: 'post',
        payload: {
          email: 'exists@boom.com',
          license: 'invalid',
          crumb: crumb
        },
        headers: { cookie: 'crumb=' + crumb }
      };

      server.inject(opts, function (resp) {
        expect(resp.statusCode).to.equal(400);
        var source = resp.request.response.source;
        expect(source.template).to.equal('enterprise/invalid-license');
        expect(source.context.msg).to.equal('The email or license key you entered appear to be invalid.');
        done();
      });
    });
  });

  it('has an error if there is a hypothetical issue with hubspot', function (done) {
    generateCrumb(server, function (crumb) {
      var opts = {
        url: '/enterprise/license',
        method: 'post',
        payload: {
          email: 'error@boom.com',
          crumb: crumb
        },
        headers: { cookie: 'crumb=' + crumb }
      };

      server.inject(opts, function (resp) {
        expect(resp.statusCode).to.equal(500);
        var source = resp.request.response.source;
        expect(source.template).to.equal('enterprise/invalid-license');
        expect(source.context.msg).to.equal('This looks like an error on our part.');
        done();
      });
    });
  });

  it('renders an error if there is a license but the customer does not yet exist', function (done) {
    generateCrumb(server, function (crumb) {
      var opts = {
        url: '/enterprise/license',
        method: 'post',
        payload: {
          email: 'new@boom.com',
          license: '12ab34cd-a123-4b56-789c-1de2f3ab45cd',
          crumb: crumb
        },
        headers: { cookie: 'crumb=' + crumb }
      };

      server.inject(opts, function (resp) {
        expect(resp.statusCode).to.equal(400);
        var source = resp.request.response.source;
        expect(source.template).to.equal('enterprise/invalid-license');
        expect(source.context.msg).to.equal("Try again without a license key to get a signup link.");
        done();
      });
    });
  });

  it('displays license options page to an existing customer with a valid license', function (done) {
    generateCrumb(server, function (crumb) {
      var opts = {
        url: '/enterprise/license',
        method: 'post',
        payload: {
          email: 'exists@boom.com',
          license: '12ab34cd-a123-4b56-789c-1de2f3ab45cd',
          crumb: crumb
        },
        headers: { cookie: 'crumb=' + crumb }
      };

      server.inject(opts, function (resp) {
        expect(resp.statusCode).to.equal(200);
        var source = resp.request.response.source;
        expect(source.template).to.equal('enterprise/license-options');
        expect(source.context.stripeKey).to.exist();
        expect(source.context.billingEmail).to.exist();
        expect(source.context.customerId).to.equal("12345");
        done();
      });
    });
  });

  it('renders an error if the customer exists but the license is invalid', function (done) {
    generateCrumb(server, function (crumb) {
      var opts = {
        url: '/enterprise/license',
        method: 'post',
        payload: {
          email: 'badLicense@boom.com',
          license: '12ab34cd-a123-4b56-789c-1de2f3ab45cd',
          crumb: crumb
        },
        headers: { cookie: 'crumb=' + crumb }
      };

      server.inject(opts, function (resp) {
        expect(resp.statusCode).to.equal(400);
        var source = resp.request.response.source;
        expect(source.template).to.equal('enterprise/invalid-license');
        expect(source.context.msg).to.equal("Try again without a license key to get a signup link.");
        done();
      });
    });    });

  it('sends an email to an existing user with no license', function (done) {
    generateCrumb(server, function (crumb) {
      var opts = {
        url: '/enterprise/license',
        method: 'post',
        payload: {
          email: 'exists@boom.com',
          crumb: crumb
        },
        headers: { cookie: 'crumb=' + crumb }
      };

      server.inject(opts, function (resp) {
        expect(resp.statusCode).to.equal(200);
        var source = resp.request.response.source;
        expect(source.template).to.equal('enterprise/check-email');
        done();
      });
    });
  });

  it('sends an email to a new user with no license', function (done) {
    generateCrumb(server, function (crumb) {
      var opts = {
        url: '/enterprise/license',
        method: 'post',
        payload: {
          email: 'new@boom.com',
          crumb: crumb
        },
        headers: { cookie: 'crumb=' + crumb }
      };

      server.inject(opts, function (resp) {
        expect(resp.statusCode).to.equal(200);
        var source = resp.request.response.source;
        expect(source.template).to.equal('enterprise/check-email');
        done();
      });
    });  });
});
