var Code = require('code'),
  Lab = require('lab'),
  lab = exports.lab = Lab.script(),
  describe = lab.experiment,
  before = lab.before,
  after = lab.after,
  it = lab.test,
  expect = Code.expect;

var server;


before(function(done) {
  require('../mocks/server')(function(obj) {
    server = obj;
    server.app.cache._cache.connection.client = {};
    done();
  }, require('../../lib/error-handler'));
});

after(function(done) {
  delete server.app.cache._cache.connection.client;
  server.stop(done);
});

describe('finishing the enterprise signup process', function() {
  it('takes us to the enterprise/complete page if everything goes perfectly', function(done) {

    var opts = {
      url: '/enterprise-verify?v=12345'
    };

    server.inject(opts, function(resp) {
      expect(resp.statusCode).to.equal(200);
      var source = resp.request.response.source;
      expect(source.template).to.equal('enterprise/complete');
      expect(source.context.email).to.equal('exists@bam.com');
      done();
    });
  });

  it('takes us to a 404 page if the url does not include the verification key', function(done) {

    var opts = {
      url: '/enterprise-verify'
    };

    server.inject(opts, function(resp) {
      expect(resp.statusCode).to.equal(404);
      var source = resp.request.response.source;
      expect(source.template).to.equal('errors/not-found');
      done();
    });
  });

  it('errors out if the trial cannot be verified', function(done) {

    var opts = {
      url: '/enterprise-verify?v=error'
    };

    server.inject(opts, function(resp) {
      expect(resp.statusCode).to.equal(500);
      var source = resp.request.response.source;
      expect(source.template).to.equal('errors/internal');
      done();
    });
  });

  it('errors out if the customer could not be found', function(done) {

    var opts = {
      url: '/enterprise-verify?v=23456'
    };

    server.inject(opts, function(resp) {
      expect(resp.statusCode).to.equal(500);
      var source = resp.request.response.source;
      expect(source.template).to.equal('errors/internal');
      done();
    });
  });

  it('errors out if the license server returns an error', function(done) {

    var opts = {
      url: '/enterprise-verify?v=licenseBroken'
    };

    server.inject(opts, function(resp) {
      expect(resp.statusCode).to.equal(500);
      var source = resp.request.response.source;
      expect(source.template).to.equal('errors/internal');
      done();
    });
  });

  it('errors out if the licenses could not be found', function(done) {

    var opts = {
      url: '/enterprise-verify?v=noLicense'
    };

    server.inject(opts, function(resp) {
      expect(resp.statusCode).to.equal(400);
      var source = resp.request.response.source;
      expect(source.template).to.equal('errors/internal');
      done();
    });
  });

  it('errors out if too many licenses are found', function(done) {

    var opts = {
      url: '/enterprise-verify?v=tooManyLicenses'
    };

    server.inject(opts, function(resp) {
      expect(resp.statusCode).to.equal(400);
      var source = resp.request.response.source;
      expect(source.template).to.equal('errors/internal');
      done();
    });
  });
});
