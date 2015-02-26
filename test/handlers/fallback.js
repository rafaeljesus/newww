var Code = require('code'),
    nock = require('nock'),
    fixtures = require("../fixtures"),
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
    done();
  });
});

after(function (done) {
  server.stop(done);
});

describe('Accessing fallback URLs', function () {

  it('renders a corporate page if given path exists as a static file in one of the static page repos', function (done) {
    var opts = {
      url: '/jobs'
    };

    server.inject(opts, function (resp) {
      expect(resp.statusCode).to.equal(200);
      var source = resp.request.response.source;
      expect(source.template).to.equal('company/corporate');
      done();
    });
  });

  it('redirects to package page for packages that exist', function (done) {
    var opts = {url: '/browserify'};

    var mock = nock("https://user-api-example.com")
      .get("/package/browserify")
      .reply(200, fixtures.packages.browserify)

    server.inject(opts, function (resp) {
      expect(resp.statusCode).to.equal(302);
      expect(resp.headers.location).to.include('/package/browserify');
      done();
    });
  });

  it('renders 404 page for anything else', function (done) {
    var opts = {
      url: '/blajklasji'
    };

    var mock = nock("https://user-api-example.com")
      .get("/package/blajklasji")
      .reply(404)

    server.inject(opts, function (resp) {
      mock.done()
      expect(resp.statusCode).to.equal(404);
      var source = resp.request.response.source;
      expect(source.template).to.equal('errors/not-found');
      done();
    });
  });

  it('add package name to view context if path is a valid npm package name', function (done) {
    var opts = {
      url: '/some-package-hklsj'
    };

    var mock = nock("https://user-api-example.com")
      .get("/package/some-package-hklsj")
      .reply(404)

    server.inject(opts, function (resp) {
      mock.done()
      var source = resp.request.response.source;
      expect(source.context.package.name).to.equal("some-package-hklsj")
      done();
    });
  });
});
