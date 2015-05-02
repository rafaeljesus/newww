var generateCrumb = require("../handlers/crumb.js"),
    expect = require('code').expect,
    Lab = require('lab'),
    lab = exports.lab = Lab.script(),
    describe = lab.experiment,
    before = lab.before,
    after = lab.after,
    it = lab.test,
    server;

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

describe('Getting to the thank-you page', function () {
  it('creates a new trial when a customer does not have one yet', function (done) {

    generateCrumb(server, function (crumb){

      var opts = {
        method: 'post',
        url: '/enterprise-trial-signup',
        payload: {
          crumb: crumb,
          customer_email: 'exists@bam.com',
          customer_id: '12345',
          agree: true
        },
        headers: { cookie: 'crumb=' + crumb }
      };

      server.inject(opts, function (resp) {
        var source = resp.request.response.source;
        expect(resp.statusCode).to.equal(200);
        expect(source.template).to.equal('enterprise/thanks');
        done();
      });
    });
  });

  it('returns an error if the customer does not exist yet', function (done) {

    generateCrumb(server, function (crumb){
      var opts = {
        method: 'post',
        url: '/enterprise-trial-signup',
        payload: {
          crumb: crumb,
          customer_email: 'new@bam.com',
          customer_id: '12345',
          agree: true
        },
        headers: { cookie: 'crumb=' + crumb }
      };

      server.inject(opts, function (resp) {
        expect(resp.statusCode).to.equal(500);
        var source = resp.request.response.source;
        expect(source.template).to.equal('errors/internal');
        done();
      });
    });
  });

  it('returns an error if the given customer id does not match the stored customer id', function (done) {

    generateCrumb(server, function (crumb){
      var opts = {
        method: 'post',
        url: '/enterprise-trial-signup',
        payload: {
          crumb: crumb,
          customer_email: 'new@bam.com',
          customer_id: '67890',
          agree: true
        },
        headers: { cookie: 'crumb=' + crumb }
      };

      server.inject(opts, function (resp) {
        expect(resp.statusCode).to.equal(500);
        var source = resp.request.response.source;
        expect(source.template).to.equal('errors/internal');
        done();
      });
    });
  });
});
