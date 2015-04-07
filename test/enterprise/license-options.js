var Code = require('code'),
    Lab = require('lab'),
    lab = exports.lab = Lab.script(),
    describe = lab.experiment,
    before = lab.before,
    after = lab.after,
    it = lab.test,
    expect = Code.expect;

var server;


before(function (done) {
  require('../mocks/server')(function (obj) {
    server = obj;
    server.app.cache._cache.connection.client = {};
    done();
  });

  process.env.STRIPE_PUBLIC_KEY = '12345';
});

after(function (done) {
  server.stop(done);
});

describe('Getting to the enterprise license purchase page', function () {
  it('renders an error if no parameters are included', function (done) {
    var opts = {
      url: '/enterprise/license-options'
    };

    server.inject(opts, function (resp) {
      expect(resp.statusCode).to.equal(400);
      var source = resp.request.response.source;
      expect(source.template).to.equal('enterprise/invalid-license');
      expect(source.context.msg).to.equal('The email or license key appears to be invalid.');
      expect(source.context.title).to.equal('npm Enterprise');
      done();
    });
  });

  it('renders an error if the email address is invalid', function (done) {
    var opts = {
      url: '/enterprise/license-options?email=invalid',
    };

    server.inject(opts, function (resp) {
      expect(resp.statusCode).to.equal(400);
      var source = resp.request.response.source;
      expect(source.template).to.equal('enterprise/invalid-license');
      expect(source.context.msg).to.equal('The email or license key appears to be invalid.');
      done();
    });
  });

  it('renders an error if neither a license nor trial are provided with the email', function (done) {
    var opts = {
      url: '/enterprise/license-options?email=exists@boom.com',
    };

    server.inject(opts, function (resp) {
      expect(resp.statusCode).to.equal(400);
      var source = resp.request.response.source;
      expect(source.template).to.equal('enterprise/invalid-license');
      expect(source.context.msg).to.equal("You need a license key or a trial ID.");
      done();
    });
  });

  it('renders an error if the license is invalid', function (done) {
    var opts = {
      url: '/enterprise/license-options?email=badLicense@boom.com&license=12ab34cd-a123-4b56-789c-1de2f3ab45cd',
    };

    server.inject(opts, function (resp) {
      expect(resp.statusCode).to.equal(400);
      var source = resp.request.response.source;
      expect(source.template).to.equal('enterprise/invalid-license');
      expect(source.context.msg).to.be.empty();
      done();
    });
  });

  it('renders an error if the trial is invalid', function (done) {
    var opts = {
      url: '/enterprise/license-options?email=badLicense@boom.com&trial=55610057-d3e9-41e2-b668-9ca18396ee38',
    };

    server.inject(opts, function (resp) {
      expect(resp.statusCode).to.equal(500);
      var source = resp.request.response.source;
      expect(source.template).to.equal('enterprise/invalid-license');
      expect(source.context.msg).to.be.empty();
      done();
    });
  });

  it('renders an error if the customer is invalid', function (done) {
    var opts = {
      url: '/enterprise/license-options?email=new@boom.com&license=12ab34cd-a123-4b56-789c-1de2f3ab45cd',
    };

    server.inject(opts, function (resp) {
      expect(resp.statusCode).to.equal(404);
      var source = resp.request.response.source;
      expect(source.template).to.equal('enterprise/invalid-license');
      expect(source.context.msg).to.be.not.exist();
      done();
    });
  });

  it('shows the license options page if the customer and license are valid', function (done) {
    var opts = {
      url: '/enterprise/license-options?email=exists@boom.com&license=12ab34cd-a123-4b56-789c-1de2f3ab45cd',
    };

    server.inject(opts, function (resp) {
      expect(resp.statusCode).to.equal(200);
      var source = resp.request.response.source;
      expect(source.template).to.equal('enterprise/license-options');
      expect(source.context.billingEmail).to.exist();
      expect(source.context.customerId).to.exist();
      expect(source.context.stripeKey).to.exist();
      done();
    });
  });

  it('shows the license options page if the customer and trial are valid', function (done) {
    var opts = {
      url: '/enterprise/license-options?email=exists@boom.com&trial=12ab34cd-a123-4b56-789c-1de2f3ab45cd',
    };

    server.inject(opts, function (resp) {
      expect(resp.statusCode).to.equal(200);
      var source = resp.request.response.source;
      expect(source.template).to.equal('enterprise/license-options');
      expect(source.context.billingEmail).to.exist();
      expect(source.context.customerId).to.exist();
      expect(source.context.stripeKey).to.exist();
      done();
    });
  });
});

