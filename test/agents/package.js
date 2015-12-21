var USER_API = "https://user-api-example.com";

var Code = require('code'),
  Lab = require('lab'),
  lab = exports.lab = Lab.script(),
  describe = lab.experiment,
  it = lab.test,
  expect = Code.expect,
  nock = require("nock"),
  fixtures = require("../fixtures"),
  Package = require("../../agents/package");

describe("Package", function() {

  describe("get()", function() {

    it("makes an external request for /package/{package}", function(done) {
      var mock = nock(USER_API)
        .get('/package/orientdb')
        .reply(200, fixtures.packages.orientdb);

      Package().get("orientdb")
        .then(function(pkg) {
          expect(pkg).to.exist();
        })
        .catch(function(err) {
          expect(err).to.be.null();
        })
        .then(function() {
          mock.done();
          done();
        });

    });

    it("returns the response body", function(done) {
      var mock = nock(USER_API)
        .get('/package/orientdb')
        .reply(200, fixtures.packages.orientdb);

      Package().get("orientdb")
        .then(function(pkg) {
          expect(pkg.name).to.equal("orientdb");
          expect(pkg.versions).to.exist();
        })
        .catch(function(err) {
          expect(err).to.be.null();
        })
        .then(function() {
          mock.done();
          done();
        });

    });

    it("returns an error in the callback if the request failed", function(done) {
      var mock = nock(USER_API)
        .get('/package/foo')
        .reply(404);

      Package().get('foo')
        .then(function(pkg) {
          expect(pkg).to.not.exist();
        })
        .catch(function(err) {
          expect(err).to.exist();
          expect(err.message).to.match(/unexpected status code/);
          expect(err.statusCode).to.equal(404);
        })
        .then(function() {
          mock.done();
          done();
        });

    });

    it("does not require a bearer token", function(done) {
      var mock = nock(USER_API, {
        reqheaders: {}
      })
        .get('/package/dogbreath')
        .reply(200, fixtures.packages.orientdb);

      Package().get('dogbreath')
        .then(function(pkg) {
          expect(pkg).to.exist();
        })
        .then(function() {
          mock.done();
          done();
        })
        .catch(function(err) {
          mock.done();
          done(err);
        });

    });

    it("includes the bearer token if user is logged in when loading the package page", function(done) {

      var mock = nock(USER_API, {
        reqheaders: {
          bearer: 'rockbot'
        }
      })
        .get('/package/orientdb')
        .reply(200, fixtures.packages.orientdb);

      Package({
        name: "rockbot"
      }).get('orientdb')
        .then(function(pkg) {
          expect(pkg.name).to.equal('orientdb');
          expect(pkg.version).to.equal('1.3.0');
        })
        .catch(function(err) {
          expect(err).to.not.exist();
        })
        .then(function() {
          mock.done();
          done();
        });

    });

    it("encodes the slash in scoped package names", function(done) {
      var mock = nock(USER_API)
        .get('/package/@zeke%2Ford')
        .reply(200, fixtures.packages.browserify);

      Package().get('@zeke/ord')
        .then(function(pkg) {
          expect(pkg).to.exist();
          mock.done();
          done();
        });
    });

    describe('maybeUpgradeRRPackageData()', function () {
      it('pulls inner package-data out to top level', function (done) {
        var mock = nock(USER_API)
          .get('/package/rimraf')
          .reply(200, fixtures.packages.rr_rimraf);

        Package().get('rimraf')
          .then(function(pkg) {
            expect(pkg.name).to.equal('rimraf');
            expect(pkg.version).to.equal('2.4.4');
            mock.done();
            done();
          });
      });

      it('copies fields from latest publication to top level', function (done) {
        var mock = nock(USER_API)
          .get('/package/rimraf')
          .reply(200, fixtures.packages.rr_rimraf);

        Package().get('rimraf')
          .then(function(pkg) {
            expect(pkg.dependencies).to.deep.equal(['glob']);
            expect(pkg.keywords).to.deep.equal(['pork-chops']);
            expect(pkg.repository.type).to.equal('git');
            mock.done();
            done();
          });
      });
    });

  });

  describe("update()", function() {

    it("makes an external request and gets back a results object", function(done) {
      var mock = nock(USER_API)
        .post('/package/@wrigley_the_writer%2Fscoped_private', {
          private: true
        })
        .reply(200, fixtures.packages.wrigley_scoped_private);

      Package().update("@wrigley_the_writer/scoped_private", {
        private: true
      })
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
      var mock = nock(USER_API)
        .get('/package?sort=dependents')
        .reply(200, fixtures.aggregates.most_depended_upon_packages);

      Package().list({
        sort: "dependents"
      })
        .then(function(result) {
          expect(result.results).to.be.an.array();
          expect(result.offset).to.be.a.number();
          expect(result.hasMore).to.be.a.boolean();
        })
        .catch(function(err) {
          expect(err).to.not.exist();
        })
        .then(function() {
          mock.done();
          done();
        });

    });

    it("returns an error in the callback if the request failed", function(done) {
      var mock = nock(USER_API)
        .get('/package?')
        .reply(404);

      Package().list()
        .then(function(result) {
          expect(result).to.not.exist();
        }, function(err) {
          expect(err).to.exist();
          expect(err.message).to.match(/unexpected status code/);
          expect(err.statusCode).to.equal(404);
        })
        .catch(function(err) {
          mock.done();
          throw err;
        })
        .then(function() {
          mock.done();
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });

    it("turns options into query parameters", function(done) {
      var mock = nock(USER_API)
        .get('/package?sort=modified&count=1&offset=2')
        .reply(200, fixtures.aggregates.recently_updated_packages);

      var options = {
        sort: "modified",
        count: 1,
        offset: 2
      };

      Package().list(options)
        .then(function() {
          mock.done();
          done();
        });
    });

    describe("filtering", function() {
      it("allows results to be filtered by various properties", function(done) {
        var mock = nock(USER_API)
          .get('/package?author=zeke')
          .reply(200);

        var options = {
          author: "zeke"
        };

        Package().list(options)
          .then(function() {
            mock.done();
            done();
          });
      });
    });

    describe("ttl", function() {
      var DEFAULT_TTL = 500;

      it('sets a default ttl of 500 if one is not set', function(done) {
        var sinon = require('sinon');
        var cache = require('../../lib/cache');

        var stub = sinon.stub(cache, '_getNoCache', function(opts, callback) {
          callback(null);
        });

        var options = {
          author: "zeke"
        };

        Package().list(options)
          .then(function() {
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

        var stub = sinon.stub(cache, '_getNoCache', function(opts, callback) {
          callback(null);
        });

        var options = {
          author: "zeke"
        };

        var TTL = 60;

        Package().list(options, TTL)
          .then(function() {
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

        var stub = sinon.stub(cache, '_getNoCache', function(opts, callback) {
          callback(null);
        });

        var TTL = 60;

        Package().list(TTL)
          .then(function() {
            expect(stub.called).to.be.true();
            var args = stub.args[0][0];
            expect(args.ttl).to.equal(DEFAULT_TTL);
            stub.restore();
            done();
          });
      });
    });
  });

  describe("count()", function() {

    it("makes an external request and gets back a number", function(done) {
      var mock = nock(USER_API)
        .get('/package/-/count')
        .reply(200, 12345);

      Package().count()
        .then(function(result) {
          expect(result).to.equal(12345);
          mock.done();
          done();
        });
    });

  });

});
