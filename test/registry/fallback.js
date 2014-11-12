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

  it('add package name to view context if path contains no slashes', function (done) {
    var opts = {
      url: '/some-package-hklsj'
    };

    server.inject(opts, function (resp) {
      expect(source.context.package.name).to.equal("some-package-hklsj")
      done();
    });
  });
  
});
