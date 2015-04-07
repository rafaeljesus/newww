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

    it("makes an external request for /package/{package}", function(done) {
      var mock = nock(Package.host)
        .get('/package/orientdb')
        .reply(200, fixtures.packages.orientdb);

      Package.get("orientdb")
        .then(function(package) {
          expect(package).to.exist();
        })
        .catch(function(err) {
          expect(err).to.be.null();
        })
        .then(function(){
          mock.done();
          done();
        });

    });

    it("returns the response body", function(done) {
      var mock = nock(Package.host)
        .get('/package/orientdb')
        .reply(200, fixtures.packages.orientdb);

      Package.get("orientdb")
        .then(function(package) {
          expect(package.name).to.equal("orientdb");
          expect(package.versions).to.exist();
        })
        .catch(function(err) {
          expect(err).to.be.null();
        })
        .then(function(){
          mock.done();
          done();
        });

    });

    it("returns an error in the callback if the request failed", function(done) {
      var mock = nock(Package.host)
        .get('/package/foo')
        .reply(404);

      Package.get('foo')
        .then(function(package) {
          expect(package).to.not.exist();
        })
        .catch(function(err){
          expect(err).to.exist();
          expect(err.message).to.match(/unexpected status code/);
          expect(err.statusCode).to.equal(404);
        })
        .then(function(){
          mock.done();
          done();
        });

    });

    it("does not require a bearer token", function(done) {
      var mock = nock(Package.host, {reqheaders: {}})
        .get('/package/dogbreath')
        .reply(200, fixtures.packages.orientdb);

      Package.get('dogbreath')
        .then(function(package){
          expect(package).to.exist();
        })
        .catch(function(err){
          expect(package).to.exist();
        })
        .then(function(){
          mock.done();
          done();
        });

    });

    it("includes the bearer token if user is logged in when loading the package page", function(done) {

      Package = new (require("../../models/package"))({
        host: "https://package.com",
        bearer: "rockbot"
      });

      var mock = nock(Package.host, {
          reqheaders: {
            bearer: 'rockbot'
          }
        })
        .get('/package/orientdb')
        .reply(200, fixtures.packages.orientdb);

      Package.get('orientdb')
        .then(function(package) {
          expect(package.name).to.equal('orientdb');
          expect(package.version).to.equal('1.3.0');
        })
        .catch(function(err){
          expect(err).to.not.exist();
        })
        .then(function(){
          mock.done();
          done();
        });

    });

    it("encodes the slash in scoped package names", function(done){
      var mock = nock("https://package.com")
        .get('/package/@zeke%2Ford')
        .reply(200, fixtures.packages.browserify);

      Package.get('@zeke/ord')
        .then(function(package) {
          mock.done();
          done();
        });
    });

  });

  describe("update()", function() {

    it("makes an external request and gets back a results object", function(done) {
      var mock = nock(Package.host)
        .post('/package/@wrigley_the_writer%2Fscoped_private', {private: true})
        .reply(200, fixtures.packages.wrigley_scoped_private);

      Package.update("@wrigley_the_writer/scoped_private", {private: true})
        .then(function(result) {
          mock.done();
          expect(result).to.be.an.object();
          expect(result.private).to.be.true();
          done();
        });
    });
  });

  describe("list()", function() {

    it("makes an external request and gets back a results object", function(done) {
      var mock = nock(Package.host)
        .get('/package?sort=dependents')
        .reply(200, fixtures.aggregates.most_depended_upon_packages);

      Package.list({sort: "dependents"})
        .then(function(result) {
          expect(result.results).to.be.an.array();
          expect(result.offset).to.be.a.number();
          expect(result.hasMore).to.be.a.boolean();
        })
        .catch(function(err){
          expect(err).to.not.exist();
        })
        .then(function(){
          mock.done();
          done();
        });

    });

    it("returns an error in the callback if the request failed", function(done) {
      var mock = nock(Package.host)
        .get('/package')
        .reply(404);

      Package.list()
        .then(function(result) {
          expect(result).to.not.exist();
        })
        .catch(function(err){
          expect(err).to.exist();
          expect(err.message).to.match(/unexpected status code/);
          expect(err.statusCode).to.equal(404);
        })
        .then(function(){
          mock.done();
          done();
        });

    });

    it("turns options into query parameters", function(done) {
      var mock = nock(Package.host)
        .get('/package?sort=modified&count=1&offset=2')
        .reply(200, fixtures.aggregates.recently_updated_packages);

      var options = {
        sort: "modified",
        count: 1,
        offset: 2
      };

      Package.list(options)
        .then(function(){
          mock.done();
          done();
        });
    });

    describe("filtering", function(){
      it("allows results to be filtered by various properties", function(done) {
        var mock = nock(Package.host)
          .get('/package?author=zeke')
          .reply(200);

        var options = {
          author: "zeke"
        };

        Package.list(options)
        .then(function(){
          mock.done();
          done();
        });
      });
    });

    describe("ttl", function () {
      var DEFAULT_TTL = 500;

      it('sets a default ttl of 500 if one is not set', function(done) {
        var sinon = require('sinon');
        var cache = require('../../lib/cache');

        var stub = sinon.stub(cache, '_getNoCache', function (opts, callback) {
          callback(null);
        });

        var options = {
          author: "zeke"
        };

        Package.list(options)
        .then(function(){
          // mock.done();
          expect(stub.called).to.be.true();
          var args = stub.args[0][0];
          expect(args.ttl).to.equal(DEFAULT_TTL);
          stub.restore();
          done();
        });
      });

      it('sets a specific ttl', function(done) {
        var sinon = require('sinon');
        var cache = require('../../lib/cache');

        var stub = sinon.stub(cache, '_getNoCache', function (opts, callback) {
          callback(null);
        });

        var options = {
          author: "zeke"
        };

        var TTL = 60;

        Package.list(options, TTL)
        .then(function(){
          // mock.done();
          expect(stub.called).to.be.true();
          var args = stub.args[0][0];
          expect(args.ttl).to.equal(TTL);
          stub.restore();
          done();
        });
      });

      it('defaults to a default ttl if a TTL is passed accidentally as the only argument', function(done) {
        var sinon = require('sinon');
        var cache = require('../../lib/cache');

        var stub = sinon.stub(cache, '_getNoCache', function (opts, callback) {
          callback(null);
        });

        var TTL = 60;

        Package.list(TTL)
        .then(function(){
          // mock.done();
          expect(stub.called).to.be.true();
          var args = stub.args[0][0];
          expect(args.ttl).to.equal(DEFAULT_TTL);
          stub.restore();
          done();
        });
      });
    });
  });

  describe("count()", function(){

    it("makes an external request and gets back a number", function(done) {
      var mock = nock(Package.host)
        .get('/package/-/count')
        .reply(200, 12345);

      Package.count()
        .then(function(result) {
          expect(result).to.equal(12345);
          mock.done();
          done();
        });
    });

  });

});
