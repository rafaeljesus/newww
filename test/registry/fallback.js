var Lab = require('lab'),
    lab = exports.lab = Lab.script(),
    describe = lab.experiment,
    before = lab.before,
    after = lab.after,
    it = lab.test,
    expect = Lab.expect;

var server, serverResponse, source;

before(function (done) {
  server = require('../fixtures/setupServer')(done);

  server.ext('onPreResponse', function (request, next) {
    source = request.response.source;
    next();
  });
});

describe('Accessing fallback URLs', function () {

  it('renders a corporate page if given path exists as a static file in one of the static page repos', function (done) {
    var opts = {
      url: '/jobs'
    };

    server.inject(opts, function (resp) {
      expect(resp.statusCode).to.equal(200);
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
      expect(source.template).to.equal('errors/not-found');
      done();
    });
  });

  it('add package name to view context if path is a valid npm package name', function (done) {
    var opts = {
      url: '/some-package-hklsj'
    };

    server.inject(opts, function (resp) {
      expect(source.context.package.name).to.equal("some-package-hklsj")
      done();
    });
  });


});
