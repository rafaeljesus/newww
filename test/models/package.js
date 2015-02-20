var Code = require('code'),
    Lab = require('lab'),
    lab = exports.lab = Lab.script(),
    describe = lab.experiment,
    beforeEach = lab.beforeEach,
    afterEach = lab.afterEach,
    it = lab.test,
    expect = Code.expect,
    nock = require("nock"),
    fixtures = require("../fixtures"),
    Package;

beforeEach(function (done) {
  Package = new (require("../../models/package"))({
    host: "https://package.com"
  });
  done();
});

afterEach(function (done) {
  Package = null;
  done();
});

describe("Package", function(){

  describe("initialization", function() {
    it("defaults to process.env.USER_API as host", function(done) {
      var USER_API_OLD = process.env.USER_API;
      process.env.USER_API = "https://envy.com/";
      expect(new (require("../../models/package"))().host).to.equal('https://envy.com/');
      process.env.USER_API = USER_API_OLD;
      done();
    });

    it("accepts a custom host", function(done) {
      expect(Package.host).to.equal('https://package.com');
      done();
    });
  });

  describe("get()", function() {

    it("makes an external request for /{package}", function(done) {

      var packageMock = nock(Package.host)
        .get('/package/orientdb')
        .reply(200, fixtures.packages.orientdb);

      Package.get("orientdb", function(err, package) {
        expect(err).to.be.null();
        expect(package).to.exist();
        packageMock.done();
        done();
      });
    });

    it("returns the response body in the callback", function(done) {
      var packageMock = nock(Package.host)
        .get('/package/orientdb')
        .reply(200, fixtures.packages.orientdb);

      Package.get("orientdb", function(err, package) {
        expect(err).to.be.null();
        expect(package.name).to.equal("orientdb");
        expect(package.versions).to.exist();
        packageMock.done();
        done();
      });
    });

    it("returns an error in the callback if the request failed", function(done) {
      var packageMock = nock(Package.host)
        .get('/package/foo')
        .reply(404);

      Package.get('foo', function(err, package) {
        expect(err).to.exist();
        expect(err.message).to.equal("error getting package foo");
        expect(err.statusCode).to.equal(404);
        expect(package).to.not.exist();
        packageMock.done();
        done();
      });
    });

    it("does not require a bearer token", function(done) {
      var packageMock = nock(Package.host, {reqheaders: {}})
        .get('/package/dogbreath')
        .reply(200, fixtures.packages.orientdb);

      Package.get('dogbreath', function(err, package) {
        expect(err).to.be.null();
        expect(package).to.exist();
        packageMock.done();
        done();
      });
    });

    it("includes the bearer token if user is logged in when loading the package page", function(done) {

      Package = new (require("../../models/package"))({
        host: "https://package.com",
        bearer: "rockbot"
      });

      var packageMock = nock(Package.host, {
          reqheaders: {bearer: 'rockbot'}
        })
        .get('/package/orientdb')
        .reply(200, fixtures.packages.orientdb);

      Package.get('orientdb', function(err, package) {
        expect(err).to.not.exist();
        packageMock.done();
        expect(package.name).to.equal('orientdb');
        expect(package.version).to.equal('1.3.0');
        done();
      });

    });

    it("fetches download counts if the option is set"/*, function(done) {
      var packageMock = nock(Package.host)
        .get('/package/request')
        .reply(200, fixtures.request);

      var downloadsMock = nock("https://api.npmjs.org")
        .get('/downloads/point/last-day/request')
        .reply(200, fixtures.downloads.request['last-day'])
        .get('/downloads/point/last-week/request')
        .reply(200, fixtures.downloads.request['last-week'])
        .get('/downloads/point/last-month/request')
        .reply(200, fixtures.downloads.request['last-month']);

      Package.get("request", {downloads: true}, function(err, package) {
        packageMock.done();
        downloadsMock.done();
        expect(err).to.be.null();
        expect(package.name).to.equal("request");
        expect(package.downloads).to.exist();
        done();
      });
    }*/);

  });

  describe("getMostDependedUpon()", function() {

    it("makes an external request and gets back a results object", function(done) {
      var mock = nock(Package.host)
        .get('/package/-/dependents')
        .reply(200, fixtures.aggregates.most_depended_upon_packages);

      Package.getMostDependedUpon(function(err, result) {
        mock.done();
        expect(err).to.be.null();
        expect(result.results).to.be.an.array();
        expect(result.offset).to.be.a.number();
        expect(result.hasMore).to.be.a.boolean();
        done();
      });
    });

    it("returns an error in the callback if the request failed", function(done) {
      var mock = nock(Package.host)
        .get('/package/-/dependents')
        .reply(404);

      Package.getMostDependedUpon(function(err, result) {
        mock.done();
        expect(err).to.exist();
        expect(err.message).to.equal("error getting most-dependended-upon packages");
        expect(err.statusCode).to.equal(404);
        expect(result).to.not.exist();
        done();
      });
    });

    it("turns options into query parameters", function(done) {
      var mock = nock(Package.host)
        .get('/package/-/dependents?count=1&offset=2')
        .reply(200, fixtures.aggregates.most_depended_upon_packages);

      Package.getMostDependedUpon({count: 1, offset: 2}, function(err, result) {
        mock.done();
        done();
      });

    })

  });

  describe("getRecentlyUpdated()", function() {

    it("makes an external request and gets back a results object", function(done) {
      var mock = nock(Package.host)
        .get('/package/-/modified')
        .reply(200, fixtures.aggregates.recently_updated_packages);

      Package.getRecentlyUpdated(function(err, result) {
        mock.done();
        expect(err).to.be.null();
        expect(result.results).to.be.an.array();
        expect(result.offset).to.be.a.number();
        expect(result.hasMore).to.be.a.boolean();
        done();
      });
    });

    it("returns an error in the callback if the request failed", function(done) {
      var mock = nock(Package.host)
        .get('/package/-/modified')
        .reply(404);

      Package.getRecentlyUpdated(function(err, result) {
        mock.done();
        expect(err).to.exist();
        expect(err.message).to.equal("error getting recently updated packages");
        expect(err.statusCode).to.equal(404);
        expect(result).to.not.exist();
        done();
      });
    });

    it("turns options into query parameters", function(done) {
      var mock = nock(Package.host)
        .get('/package/-/modified?count=1&offset=2')
        .reply(200, fixtures.aggregates.recently_updated_packages);

      Package.getRecentlyUpdated({count: 1, offset: 2}, function(err, result) {
        mock.done();
        done();
      });

    })

  });

});
