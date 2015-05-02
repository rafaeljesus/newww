var fixtures = require("../fixtures"),
    expect = require('code').expect,
    Lab = require('lab'),
    lab = exports.lab = Lab.script(),
    describe = lab.experiment,
    beforeEach = lab.beforeEach,
    afterEach = lab.afterEach,
    it = lab.test,

    server;

describe('static routes', function () {

  beforeEach(function (done) {
    require('../mocks/server')(function (obj) {
      server = obj;
      done();
    });
  });

  it('GET /robots.txt', function (done) {
    var options = {
      url: '/robots.txt'
    };
    server.inject(options, function (resp) {
      expect(resp.statusCode).to.equal(200);
      expect(resp.result).to.include("User-agent: *");
      done();
    });
  });

  it('GET /opensearch.xml', function (done) {
    var options = {
      url: '/opensearch.xml'
    };
    server.inject(options, function (resp) {
      expect(resp.statusCode).to.equal(200);
      expect(resp.result).to.include("OpenSearchDescription");
      done();
    });
  });

  it('GET /google17836d108133913c.html', function (done) {
    var options = {
      url: '/google17836d108133913c.html'
    };
    server.inject(options, function (resp) {
      expect(resp.statusCode).to.equal(200);
      expect(resp.result).to.include("google-site-verification: google17836d108133913c.html");
      done();
    });
  });


});
