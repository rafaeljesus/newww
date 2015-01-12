var Code = require('code'),
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
  require('../fixtures/setupServer')(function (obj) {
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
    var opts = {
      url: '/fake'
    };

    server.inject(opts, function (resp) {
      expect(resp.statusCode).to.equal(302);
      expect(resp.headers.location).to.include('/package/fake');
      done();
    });
  });

  it('renders 404 page for anything else', function (done) {
    var opts = {
      url: '/blajklasji'
    };

    server.inject(opts, function (resp) {
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

    server.inject(opts, function (resp) {
      var source = resp.request.response.source;
      expect(source.context.package.name).to.equal("some-package-hklsj")
      done();
    });
  });
});
