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

describe('documentation routes', function () {

  it('redirects CLI pages', function (done) {
    var opts = {
      url: '/doc/cli/npm-outdated.html'
    }

    server.inject(opts, function (resp) {
      expect(resp.statusCode).to.equal(301)
      expect(resp.headers.location).to.equal('https://docs.npmjs.com/cli/outdated')
      done()
    })
  })

  it('redirects top-level /doc path', function (done) {
    var opts = {
      url: '/doc/'
    }

    server.inject(opts, function (resp) {
      expect(resp.statusCode).to.equal(301)
      expect(resp.headers.location).to.equal('https://docs.npmjs.com/')
      done()
    })
  })


  it('redirects top-level /doc path', function (done) {
    var opts = {
      url: '/doc/misc/npm-developers.html'
    }

    server.inject(opts, function (resp) {
      expect(resp.statusCode).to.equal(301)
      expect(resp.headers.location).to.equal('https://docs.npmjs.com/misc/developers')
      done()
    })
  })

})
