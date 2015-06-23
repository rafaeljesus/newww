var Code = require('code'),
    Lab = require('lab'),
    lab = exports.lab = Lab.script(),
    describe = lab.experiment,
    beforeEach = lab.beforeEach,
    afterEach = lab.afterEach,
    it = lab.test,
    expect = Code.expect,
    server;

beforeEach(function (done) {
  require('../mocks/server')(function (obj) {
    server = obj;
    done();
  });
});

afterEach(function (done) {
  server.stop(done);
});

describe('redirects for legacy routes', function () {

  it('sends /recent-authors to homepage', function (done) {
    var options = {
      url: '/recent-authors'
    };
    server.inject(options, function (resp) {
      expect(resp.statusCode).to.equal(301);
      expect(resp.headers.location).to.equal("/");
      done();
    });
  });


  it('sends /browse/all to homepage', function (done) {
    var options = {
      url: '/browse/all'
    };
    server.inject(options, function (resp) {
      expect(resp.statusCode).to.equal(301);
      expect(resp.headers.location).to.equal("/");
      done();
    });
  });


  it('sends /browse/userstar to homepage', function (done) {
    var options = {
      url: '/browse/userstar'
    };
    server.inject(options, function (resp) {
      expect(resp.statusCode).to.equal(301);
      expect(resp.headers.location).to.equal("/");
      done();
    });
  });

  it('sends /packages/{package} to /package/{package}', function (done) {
    var options = {
      url: '/packages/{package}'
    };
    server.inject(options, function (resp) {
      expect(resp.statusCode).to.equal(301);
      expect(resp.headers.location).to.equal("/package/{package}");
      done();
    });
  });

  it('sends /packages/{scope}/{project} to /package/{scope}/{project}', function (done) {
    var options = {
      url: '/packages/{scope}/{project}'
    };
    server.inject(options, function (resp) {
      expect(resp.statusCode).to.equal(301);
      expect(resp.headers.location).to.equal("/package/{scope}/{project}");
      done();
    });
  });

});
