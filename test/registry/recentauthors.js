var Lab = require('lab'),
    lab = exports.lab = Lab.script(),
    describe = lab.experiment,
    before = lab.before,
    after = lab.after,
    it = lab.test,
    expect = Lab.expect;

var server, source;

before(function (done) {
  server = require('../fixtures/setupServer')(done);

  server.ext('onPreResponse', function (request, next) {
    source = request.response.source;
    next();
  });
});

describe('getting to the recentauthors page', function () {
  it('renders the page when the url is correct', function (done) {
    var opts = {
      url: '/recent-authors'
    };

    server.inject(opts, function (resp) {
      expect(resp.statusCode).to.equal(200);
      expect(source.template).to.equal('registry/recentauthors');
      expect(source.context.errId).to.not.exist;
      done();
    });
  })

  it('renders an error if the url is invalid', function (done) {
    var opts = {
      url: '/recent-authors/blarg'
    };

    server.inject(opts, function (resp) {
      expect(resp.statusCode).to.equal(404);
      expect(source.template).to.equal('registry/error');
      expect(source.context.errId).to.exist;
      expect(source.context.errorType).to.equal('browseUrl');
      done();
    });
  });

  it('understands the page query and uses it properly', function (done) {
    var pageNum = 2;
    var opts = {
      url: '/recent-authors?page=' + pageNum
    };

    server.inject(opts, function (resp) {
      expect(resp.statusCode).to.equal(200);
      expect(source.template).to.equal('registry/recentauthors');
      expect(source.context.page).to.equal(pageNum);
      expect(source.context.nextPage).to.equal(pageNum + 1);
      expect(source.context.prevPage).to.equal(pageNum - 1);
      done();
    });
  });
});